import { eq } from "drizzle-orm";
import { loadAccessibleOrder } from "@/lib/checkout";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { paymentsMode } from "@/lib/payments-mode";
import { createRazorpayOrder } from "@/lib/razorpay";
import { orderAccessSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const parsed = orderAccessSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Order reference missing." }, 400);
  const order = await loadAccessibleOrder(parsed.data.orderNumber, parsed.data.accessToken);
  if (!order) return json({ error: "Order not found." }, 404);
  if (order.status !== "RESERVED" || order.reservationExpiresAt.getTime() < Date.now()) {
    return json({ error: "The size hold has ended. Please check out again." }, 409);
  }
  if (paymentsMode() === "demo") {
    return json({
      kind: "demo",
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      totalInr: order.totalInr,
      amountPaise: order.totalInr * 100,
    });
  }
  if (!order.razorpayOrderId) {
    const razorpay = await createRazorpayOrder({
      amountInr: order.totalInr,
      receipt: order.orderNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
    await getDb().update(orders).set({ razorpayOrderId: razorpay.id, updatedAt: new Date() }).where(eq(orders.id, order.id));
    return json({
      kind: "razorpay",
      keyId: razorpay.keyId,
      razorpayOrderId: razorpay.id,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      totalInr: order.totalInr,
      amountPaise: order.totalInr * 100,
    });
  }
  return json({
    kind: "razorpay",
    keyId: process.env.RAZORPAY_KEY_ID,
    razorpayOrderId: order.razorpayOrderId,
    orderNumber: order.orderNumber,
    accessToken: order.accessToken,
    totalInr: order.totalInr,
    amountPaise: order.totalInr * 100,
  });
}
