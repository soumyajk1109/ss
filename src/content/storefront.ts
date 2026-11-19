/**
 * Storefront copy and links. Edit this file, save, and refresh http://localhost:3000.
 * Colors live in tailwind.config.ts (turmeric, botanical, paper, charcoal).
 * Name, address, phone, and the free-shipping amount live in src/lib/brand.ts.
 */
export const storefront = {
  name: "SS",
  metaTitle: "SS — Dress for the climate",
  metaDescription:
    "Men's, women's, and kids' clothing for Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, and Pune.",
  /** `{shipping}` is replaced with the free-shipping amount from brand.ts. */
  announcement: "Inclusive of GST · Free shipping over {shipping} · COD with OTP",
  hero: {
    titleBefore: "Dress for the",
    titleEmphasis: "climate",
    body: "Men’s, women’s, and kids’ clothing for humid commutes, air-conditioned offices, and the wedding on Saturday.",
    primary: { label: "Shop the edit", href: "/shop" },
    secondary: { label: "Festive edit", href: "/shop/women/ethnic" },
  },
  departments: [
    { name: "Men", copy: "Kurtas, shirts, bandhgalas", href: "/shop/men" },
    { name: "Women", copy: "Sarees, sets, dresses", href: "/shop/women" },
    { name: "Kids", copy: "Festive, school-run, play", href: "/shop/kids" },
  ],
  rail: {
    eyebrow: "This week",
    title: "On the rail",
    linkLabel: "All pieces",
    href: "/shop",
  },
  festive: {
    eyebrow: "Festive",
    title: "Silk, handloom, mirror work.",
    body: "Ships in 2–4 days across the seven metros. A size is held for 15 minutes at checkout, then released if the payment or COD code does not land.",
    cta: { label: "See sarees", href: "/shop/women/sarees" },
  },
  metros: [
    { city: "Mumbai", pin: "400001" },
    { city: "Delhi NCR", pin: "110001" },
    { city: "Bengaluru", pin: "560001" },
    { city: "Hyderabad", pin: "500001" },
    { city: "Chennai", pin: "600001" },
    { city: "Kolkata", pin: "700001" },
    { city: "Pune", pin: "411001" },
    { city: "Free shipping", pin: "411057", freeShippingLabel: true },
  ],
  footerNote:
    "Prices include GST. UPI, cards, net banking, wallets, EMI, and cash on delivery where the pincode allows it.",
};
