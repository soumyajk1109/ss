import { loadAccessibleOrder } from "@/lib/checkout";
import { confirmPaidOrder, StockError } from "@/lib/inventory";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { paymentsMode } from "@/lib/payments-mode";
import { orderAccessSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  if (paymentsMode() !== "demo") return json({ error: "Demo capture is off." }, 404);
  const parsed = orderAccessSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Order reference missing." }, 400);
  const order = await loadAccessibleOrder(parsed.data.orderNumber, parsed.data.accessToken);
  if (!order || order.paymentMethod !== "RAZORPAY") return json({ error: "Order not found." }, 404);
  try {
    const result = await confirmPaidOrder(order.id, {
      method: "RAZORPAY",
      razorpayPaymentId: `demo_${order.orderNumber}`,
    });
    return json({ ok: true, result: result.result, status: result.order.status });
  } catch (error) {
    if (error instanceof StockError) return json({ error: error.message }, 409);
    console.error(error);
    return json({ error: "Could not simulate the payment." }, 500);
  }
}
