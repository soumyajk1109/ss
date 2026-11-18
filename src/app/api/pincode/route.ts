import { brand } from "@/lib/brand";
import { findPincode } from "@/lib/checkout";
import { json } from "@/lib/http";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (!/^[1-9][0-9]{5}$/.test(code)) return json({ serviceable: false, error: "Enter a 6-digit pincode." }, 400);
  try {
    const pin = await findPincode(code);
    if (!pin) {
      return json({
        serviceable: false,
        error: "SS currently delivers to Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, and Pune.",
      });
    }
    return json({
      serviceable: true,
      city: pin.city,
      state: pin.state,
      metro: pin.metro,
      codAvailable: pin.codAvailable,
      etaMinDays: pin.etaMinDays,
      etaMaxDays: pin.etaMaxDays,
      shippingInr: pin.shippingInr,
      freeShippingOverInr: brand.freeShippingOverInr,
    });
  } catch (error) {
    console.error(error);
    return json({ serviceable: false, error: "Delivery check is unavailable." }, 500);
  }
}
