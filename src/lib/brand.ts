export const brand = {
  name: "SS",
  legalName: process.env.SELLER_LEGAL_NAME || "SS Apparel Private Limited",
  /** Sample checksum-shaped GSTIN. Set SELLER_GSTIN before issuing real tax invoices. */
  gstin: process.env.SELLER_GSTIN || "27AABCS0000A1Z5",
  sellerIsSample: !process.env.SELLER_GSTIN,
  addressLines: ["14, Lohar Chawl Textile House", "Kalbadevi, Mumbai 400002"],
  state: "Maharashtra",
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
