import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { json } from "@/lib/http";
import { confirmPaidOrder, StockError } from "@/lib/inventory";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaymentEntity = {
  id?: string;
  order_id?: string;
  status?: string;
  amount?: number;
};

/**
 * Razorpay webhook. Dashboard setup:
 * URL: https://<host>/api/webhooks/razorpay
 * Secret: RAZORPAY_WEBHOOK_SECRET
 * Events: payment.captured, payment.failed
 * Use automatic capture. Fulfillment runs only on payment.captured.
 * The signature is checked against the raw body before any JSON parse.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return json({ error: "Invalid signature" }, 400);
  }

  let event: { event?: string; payload?: { payment?: { entity?: PaymentEntity } } };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return json({ ok: true, ignored: true });

  const [order] = await getDb().select().from(orders).where(eq(orders.razorpayOrderId, payment.order_id)).limit(1);
  if (!order) return json({ error: "Order not saved yet" }, 500);

  if (event.event === "payment.failed") {
    if (order.status === "RESERVED") {
      await getDb()
        .update(orders)
        .set({ paymentStatus: "FAILED", updatedAt: new Date(), internalNote: `payment_failed:${payment.id ?? ""}` })
        .where(eq(orders.id, order.id));
    }
    return json({ ok: true });
  }

  if (event.event !== "payment.captured") return json({ ok: true, ignored: event.event });

  try {
    const result = await confirmPaidOrder(order.id, {
      method: "RAZORPAY",
      razorpayPaymentId: payment.id,
      expectedAmountPaise: typeof payment.amount === "number" ? payment.amount : undefined,
    });
    return json({ ok: true, result: result.result });
  } catch (error) {
    if (error instanceof StockError) {
      await getDb()
        .update(orders)
        .set({ internalNote: `stock_commit_failed:${error.code}`, updatedAt: new Date() })
        .where(eq(orders.id, order.id));
    }
    console.error("webhook_confirm_failed", order.orderNumber, error);
    return json({ error: "Could not commit stock" }, 500);
  }
}
