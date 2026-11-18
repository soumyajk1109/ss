import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";
import { getNavTree, listPublishedSlugs } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.8 },
  ];
  try {
    const nav = await getNavTree();
    for (const department of nav) {
      entries.push({ url: `${base}/shop/${department.slug}`, changeFrequency: "daily", priority: 0.7 });
      for (const category of department.categories) {
        entries.push({ url: `${base}/shop/${department.slug}/${category.slug}`, changeFrequency: "weekly", priority: 0.5 });
      }
    }
    const products = await listPublishedSlugs();
    for (const product of products) {
      entries.push({
        url: `${base}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    return entries;
  }
  return entries;
}
