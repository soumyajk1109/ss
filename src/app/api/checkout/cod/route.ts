import { loadAccessibleOrder } from "@/lib/checkout";
import { confirmPaidOrder, StockError } from "@/lib/inventory";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { codSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const parsed = codSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Enter the 6-digit code." }, 400);
  const order = await loadAccessibleOrder(parsed.data.orderNumber, parsed.data.accessToken);
  if (!order || order.paymentMethod !== "COD") return json({ error: "Order not found." }, 404);
  if (order.status !== "COD_PENDING") return json({ error: "This order is not waiting for a code.", status: order.status }, 409);

  if (parsed.data.action === "resend") {
    try {
      const issued = await issueOtp({ destination: order.phone, purpose: "COD", orderId: order.id });
      return json({ ok: true, devCode: issued.devCode });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send a code.";
      return json({ error: message }, message.includes("Too many") ? 429 : 400);
    }
  }

  if (!parsed.data.code) return json({ error: "Enter the 6-digit code." }, 400);
  const check = await verifyOtp({
    destination: order.phone,
    purpose: "COD",
    code: parsed.data.code,
    orderId: order.id,
  });
  if (!check.ok) return json({ error: check.reason }, 400);
  try {
    const result = await confirmPaidOrder(order.id, { method: "COD" });
    return json({ ok: true, result: result.result, status: result.order.status });
  } catch (error) {
    if (error instanceof StockError) return json({ error: error.message }, 409);
    console.error(error);
    return json({ error: "Could not confirm cash on delivery." }, 500);
  }
}
