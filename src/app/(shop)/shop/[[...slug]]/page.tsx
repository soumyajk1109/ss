import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Filters } from "@/components/shop/Filters";
import { ProductCard } from "@/components/shop/ProductCard";
import { listProducts } from "@/lib/catalog";
import type { SizeType } from "@/lib/types";
import { oneParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Shop" };

const sizes = new Set(["ALPHA", "NUMERIC", "KIDS_AGE"]);

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug = [] } = await params;
  const sp = await searchParams;
  const [departmentSlug, categorySlug] = slug;
  if (slug.length > 2) notFound();
  const sizeType = oneParam(sp.sizeType);
  const min = Number(oneParam(sp.min));
  const max = Number(oneParam(sp.max));
  const priced = oneParam(sp.priced) === "1";
  const sort = oneParam(sp.sort);
  let result: Awaited<ReturnType<typeof listProducts>> | null = null;
  try {
    result = await listProducts({
      departmentSlug,
      categorySlug,
      color: oneParam(sp.color),
      fabric: oneParam(sp.fabric),
      sizeType: sizeType && sizes.has(sizeType) ? (sizeType as SizeType) : undefined,
      minPrice: priced && Number.isFinite(min) ? min : undefined,
      maxPrice: priced && Number.isFinite(max) ? max : undefined,
      inStock: oneParam(sp.inStock) === "1",
      sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-4xl">The shop is not connected.</h1>
        <p className="mt-3 text-sm text-clay">Push the schema and seed the catalog.</p>
        {process.env.NODE_ENV !== "production" ? <pre className="mt-4 text-xs">{message}</pre> : null}
      </div>
    );
  }
  if (!result) notFound();
  const title = result.categoryName ?? result.department?.name ?? "The edit";

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[16rem_1fr]">
      <Filters
        facets={result.facets}
        current={{
          color: oneParam(sp.color),
          fabric: oneParam(sp.fabric),
          sizeType,
          min: oneParam(sp.min),
          max: oneParam(sp.max),
          inStock: oneParam(sp.inStock) === "1",
          sort,
          priced,
        }}
      />
      <div>
        <p className="eyebrow">{result.department?.name ?? "All departments"}</p>
        <h1 className="mt-2 font-display text-5xl">{title}</h1>
        {result.department?.description ? <p className="mt-3 max-w-xl text-sm leading-6 text-clay">{result.department.description}</p> : null}
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-clay">{result.products.length} pieces</p>
        {result.products.length ? (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-sm text-clay">Nothing in this cut. Clear the filters or look at another category.</p>
        )}
      </div>
    </div>
  );
}
