export const brand = {
  name: "RCS",
  legalName: process.env.SELLER_LEGAL_NAME || "Ranebennur Cloth Stores",
  /** Sample checksum-shaped GSTIN. Set SELLER_GSTIN before issuing real tax invoices. */
  gstin: process.env.SELLER_GSTIN || "27AABCS0000A1Z5",
  sellerIsSample: !process.env.SELLER_GSTIN,
  addressLines: ["Gandhi Circle, Holalu"],
  state: "Karnataka",
  stateCode: "29",
  email: "care@ssapparel.example",
  phone: "+91 9448867882",
  tagline: "Silks, sarees, and everyday wear.",
  freeShippingOverInr: 2999,
  codFeeInr: 40,
  reservationMinutes: 15,
  metros: ["Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune"],
};

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
