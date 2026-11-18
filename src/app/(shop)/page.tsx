import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { brand } from "@/lib/brand";
import { listProducts } from "@/lib/catalog";
import { formatInr } from "@/lib/utils";

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof listProducts>> | null = null;
  let dbError = "";
  try {
    featured = await listProducts({ sort: "newest" });
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Database unavailable";
  }
  const products = featured?.products.slice(0, 8) ?? [];

  return (
    <div>
      <section className="bg-botanical text-paper">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="text-[11px] uppercase tracking-[0.28em] text-paper/70">{brand.metros.join(" · ")}</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Dress for the <span className="italic text-turmeric">climate</span>.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-paper/80">
            Men’s, women’s, and kids’ clothing for humid commutes, air-conditioned offices, and the wedding on Saturday.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-turmeric">Shop the edit</Link>
            <Link href="/shop/women/ethnic" className="btn border border-paper/30 text-paper">Festive edit</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-10 md:grid-cols-3">
        {[
          ["Men", "Kurtas, shirts, bandhgalas", "/shop/men"],
          ["Women", "Sarees, sets, dresses", "/shop/women"],
          ["Kids", "Festive, school-run, play", "/shop/kids"],
        ].map(([name, copy, href]) => (
          <Link key={name} href={href} className="rounded-3xl border border-line bg-white p-6 hover:border-botanical">
            <p className="eyebrow">{name}</p>
            <p className="mt-3 font-display text-3xl">{copy}</p>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">This week</p>
            <h2 className="mt-2 font-display text-4xl">On the rail</h2>
          </div>
          <Link href="/shop" className="text-sm underline">All pieces</Link>
        </div>
        {dbError ? (
          <div className="mt-8 max-w-xl">
            <h3 className="font-display text-3xl">Connect Postgres to open the shop.</h3>
            <p className="mt-2 text-sm leading-6 text-clay">Copy .env.example to .env, start the database, then run db:push and db:seed.</p>
            {process.env.NODE_ENV !== "production" ? <pre className="mt-4 overflow-auto rounded-2xl bg-white p-3 text-xs">{dbError}</pre> : null}
          </div>
        ) : products.length ? (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-clay">The catalog is empty. Run npm run db:seed.</p>
        )}
      </section>

      <section className="mx-auto my-8 grid max-w-6xl overflow-hidden rounded-[2rem] bg-botanical text-paper md:grid-cols-2">
        <div className="p-8 md:p-12">
          <p className="text-[11px] uppercase tracking-[0.22em] text-turmeric">Festive</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Silk, handloom, mirror work.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-paper/80">Ships in 2–4 days across the seven metros. A size is held for 15 minutes at checkout, then released if the payment or COD code does not land.</p>
          <Link href="/shop/women/sarees" className="btn-turmeric mt-6">See sarees</Link>
        </div>
        <div className="min-h-64 bg-[radial-gradient(circle_at_30%_20%,#E5A93B,transparent_40%),linear-gradient(160deg,#12352B,#1B4D3E)]" />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <p className="eyebrow">Metros</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Mumbai", "400001"],
            ["Delhi NCR", "110001"],
            ["Bengaluru", "560001"],
            ["Hyderabad", "500001"],
            ["Chennai", "600001"],
            ["Kolkata", "700001"],
            ["Pune", "411001"],
            ["Free over " + formatInr(brand.freeShippingOverInr), "411057"],
          ].map(([city, pin]) => (
            <li key={city} className="rounded-2xl border border-line px-4 py-3">
              <p className="font-medium">{city}</p>
              <p className="text-sm text-clay">Try pincode {pin}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
