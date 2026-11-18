import { createHmac } from "crypto";
import Razorpay from "razorpay";
import { paymentsMode } from "@/lib/payments-mode";
import { safeEqual } from "@/lib/utils";

type RzpClient = {
  orders: {
    create: (body: {
      amount: number;
      currency: "INR";
      receipt: string;
      notes: Record<string, string>;
      payment_capture: boolean;
    }) => Promise<{ id: string }>;
  };
};

export function getRazorpay(): RzpClient | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret }) as unknown as RzpClient;
}

export async function createRazorpayOrder(input: { amountInr: number; receipt: string; orderId: string; orderNumber: string }) {
  if (paymentsMode() !== "live") {
    throw new Error("Razorpay is not in live mode.");
  }
  const client = getRazorpay();
  if (!client) throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for live payments.");
  const order = await client.orders.create({
    amount: input.amountInr * 100,
    currency: "INR",
    receipt: input.receipt.slice(0, 40),
    notes: { orderId: input.orderId, orderNumber: input.orderNumber },
    payment_capture: true,
  });
  return { id: order.id, keyId: process.env.RAZORPAY_KEY_ID! };
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
