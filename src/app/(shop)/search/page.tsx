import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/shop/SearchBox";
import { searchProducts } from "@/lib/catalog";
import { oneParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = oneParam((await searchParams).q) ?? "";
  let results: Awaited<ReturnType<typeof searchProducts>> = [];
  let failed = false;
  if (q.trim().length >= 2) {
    try {
      results = await searchProducts(q, 24);
    } catch {
      failed = true;
    }
  }
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="eyebrow">Search</p>
      <h1 className="mt-2 font-display text-5xl">Find a piece.</h1>
      <div className="mt-6">
        <SearchBox compact />
      </div>
      {failed ? <p className="mt-6 text-sm text-clay">Search needs the database.</p> : null}
      {q.trim().length >= 2 ? (
        <ul className="mt-8 divide-y divide-line">
          {results.map((result) => (
            <li key={result.slug}>
              <Link href={`/product/${result.slug}`} className="flex items-baseline justify-between gap-4 py-4">
                <span>
                  <span className="font-display text-2xl">{result.title}</span>
                  {result.fabric ? <span className="mt-1 block text-sm text-clay">{result.fabric}</span> : null}
                </span>
                <span className="text-xs uppercase tracking-[0.16em] text-clay">{result.department}</span>
              </Link>
            </li>
          ))}
          {!results.length && !failed ? <li className="py-6 text-sm text-clay">No matches for “{q}”.</li> : null}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-clay">Try kurta, silk, polo, or a SKU.</p>
      )}
    </div>
  );
}
