export type PaymentsMode = "live" | "demo";

export function paymentsMode(): PaymentsMode {
  if (process.env.PAYMENTS_MODE === "live") return "live";
  if (process.env.PAYMENTS_MODE === "demo") return "demo";
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return "live";
  return "demo";
}
