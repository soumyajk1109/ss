export const brand = {
  name: "RCS",
  legalName: process.env.SELLER_LEGAL_NAME || "RCS",
  /** Sample checksum-shaped GSTIN. Set SELLER_GSTIN before issuing real tax invoices. */
  gstin: process.env.SELLER_GSTIN || "27AABCS0000A1Z5",
  sellerIsSample: !process.env.SELLER_GSTIN,
  addressLines: ["Holalu, Karnataka 400002"],
  state: "Karnataka",
  stateCode: "27",
  email: "care@ssapparel.example",
  phone: "+91 22 4000 2210",
  tagline: "Dress for the climate.",
  freeShippingOverInr: 2999,
  codFeeInr: 40,
  reservationMinutes: 15,
  metros: ["Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune"],
};

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
