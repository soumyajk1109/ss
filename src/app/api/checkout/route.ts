import { auth } from "@/lib/auth";
import { readCartId } from "@/lib/cart";
import { CheckoutError, placeOrder } from "@/lib/checkout";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { checkoutSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const parsed = checkoutSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Check the address and try again.", issues: parsed.error.flatten() }, 400);
  const cartId = await readCartId();
  if (!cartId) return json({ error: "Your bag is empty." }, 400);
  const session = await auth();
  try {
    const placed = await placeOrder({
      cartId,
      userId: session?.user?.id ?? null,
      email: parsed.data.email || session?.user?.email || null,
      method: parsed.data.method,
      address: {
        ...parsed.data.address,
        line2: parsed.data.address.line2 || undefined,
      },
    });
    return json({
      kind: placed.kind,
      orderNumber: placed.order.orderNumber,
      accessToken: placed.order.accessToken,
      totalInr: placed.order.totalInr,
      amountPaise: placed.order.totalInr * 100,
      currency: "INR",
      reservationExpiresAt: placed.order.reservationExpiresAt,
      keyId: placed.kind === "razorpay" ? placed.keyId : undefined,
      razorpayOrderId: placed.order.razorpayOrderId,
      devCode: placed.kind === "cod" ? placed.devCode : undefined,
      otpError: placed.kind === "cod" ? placed.otpError : undefined,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      const status = error.code === "INSUFFICIENT_STOCK" ? 409 : error.code === "PAYMENT" ? 502 : 400;
      return json({ error: error.message, code: error.code }, status);
    }
    console.error(error);
    return json({ error: "Checkout could not start." }, 500);
  }
}
