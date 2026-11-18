import { loadAccessibleOrder } from "@/lib/checkout";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { confirmPaidOrder, StockError } from "@/lib/inventory";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { verifyPaymentSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const parsed = verifyPaymentSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Payment confirmation was incomplete." }, 400);
  const order = await loadAccessibleOrder(parsed.data.orderNumber, parsed.data.accessToken);
  if (!order) return json({ error: "Order not found." }, 404);
  if (order.razorpayOrderId && order.razorpayOrderId !== parsed.data.razorpay_order_id) {
    return json({ error: "This payment does not match the order." }, 400);
  }
  if (!verifyPaymentSignature(parsed.data.razorpay_order_id, parsed.data.razorpay_payment_id, parsed.data.razorpay_signature)) {
    return json({ error: "Razorpay signature did not match." }, 400);
  }
  try {
    const result = await confirmPaidOrder(order.id, {
      method: "RAZORPAY",
      razorpayPaymentId: parsed.data.razorpay_payment_id,
      expectedAmountPaise: order.totalInr * 100,
    });
    return json({ ok: true, result: result.result, status: result.order.status });
  } catch (error) {
    if (error instanceof StockError) return json({ error: error.message }, 409);
    console.error(error);
    return json({ error: "Could not confirm the payment." }, 500);
  }
}
