/**
 * Brochure copy. The site does not sell online.
 * Logo colours: red, gold, charcoal, cream — see tailwind.config.ts.
 */
export const storefront = {
  name: "RCS",
  fullName: "Ranebennur Cloth Stores",
  logo: "/rcs-logo.jpg",
  metaTitle: "RCS Clothing — Ranebennur Cloth Stores",
  metaDescription: "Silk, Art silk, Daily wear, Linen, Tissue sarees and many more are available at Ranebennur Cloth Stores, Gandhi Circle, Holalu.",
  announcement: "Ranebennur Cloth Stores · Gandhi Circle, Holalu",
  hero: {
    kicker: "RCS Clothing",
    title: "Ranebennur Cloth Stores",
    line: "Woven with love, worn for every occasion.",
  },
  about:
    "ಮದುವೆ ರೇಷ್ಮೆ, ಕೈಮಗ್ಗ ಹಾಗೂ ನಿತ್ಯದ ಸೀರೆಗಳ ಸಂಪೂರ್ಣ ಮಳಿಗೆ.\nYour destination for Bridal Silks, Handlooms & Everyday Sarees.",
  collections: [
    {
      slug: "silk",
      name: "Silk",
      blurb: "Pure silk sarees with a firm hand and a deep shine, kept for weddings and temple visits.",
      hex: "#E10600",
      image: "/collections/silk.jpg",
    },
    {
      slug: "art-silk",
      name: "Art silk",
      blurb: "Art silk with the drape of silk and a lighter feel for festive evenings.",
      hex: "#F0B429",
      image: "/collections/art-silk.jpg",
    },
    {
      slug: "daily-wear",
      name: "Daily wear saree",
      blurb: "Sarees meant for the week: easy cotton and simple borders you can pleat in a minute.",
      hex: "#C4513C",
      image: "/collections/daily-wear.jpg",
    },
    {
      slug: "linen",
      name: "Linen sarees",
      blurb: "Linen sarees with a dry weave, for hot afternoons in Holalu.",
      hex: "#E4C98A",
      image: "/collections/linen.jpg",
    },
    {
      slug: "tissue",
      name: "Tissue sarees",
      blurb: "Tissue sarees shot with a fine metallic thread, light enough for a reception.",
      hex: "#F6E7B2",
      image: "/collections/tissue.jpg",
    },
  ],
  visit: ["RCS Gandhi Circle, Holalu"],
  footerNote: "Ranebennur Cloth Stores · Gandhi Circle, Holalu",
};

export function collectionBySlug(slug: string) {
  return storefront.collections.find((item) => item.slug === slug);
}
