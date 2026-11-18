import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductCard } from "@/components/shop/ProductCard";
import { Textile } from "@/components/shop/Textile";
import { getProductBySlug } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return { title: "Piece" };
    return { title: product.title, description: product.description };
  } catch {
    return { title: "Piece" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) notFound();
  const swatch = product.variants[0]?.colorHex ?? "#E6E0D4";
  const attrs = [
    ["Fabric", product.attributes.fabric],
    ["Fit", product.attributes.fit],
    ["Occasion", product.attributes.occasion],
    ["Wash", product.attributes.wash_care],
    ["Age", product.attributes.age_group],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <article className="mx-auto max-w-6xl px-5 py-8">
      <p className="text-sm text-clay">
        <Link href={`/shop/${product.departmentSlug}`}>{product.departmentName}</Link>
        {" / "}
        <Link href={`/shop/${product.departmentSlug}/${product.categorySlug}`}>{product.categoryName}</Link>
      </p>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <Textile hex={swatch} label={product.categoryName} patternKey={product.slug} large />
        <div>
          <h1 className="font-display text-4xl leading-none md:text-5xl">{product.title}</h1>
          <p className="mt-4 text-sm leading-7 text-clay">{product.description}</p>
          <div className="mt-6">
            <BuyBox
              title={product.title}
              department={product.departmentSlug}
              hsnCode={product.hsnCode}
              gstRate={product.gstRate}
              variants={product.variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                sizeType: variant.sizeType,
                sizeValue: variant.sizeValue,
                colorName: variant.colorName,
                colorHex: variant.colorHex,
                mrpInr: variant.mrpInr,
                sellingPriceInr: variant.sellingPriceInr,
                available: variant.available,
              }))}
            />
          </div>
        </div>
      </div>
      {attrs.length ? (
        <dl className="mt-12 grid gap-4 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-5">
          {attrs.map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-2 text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {product.similar.length ? (
        <section className="mt-14">
          <h2 className="font-display text-3xl">Alongside it</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {product.similar.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
