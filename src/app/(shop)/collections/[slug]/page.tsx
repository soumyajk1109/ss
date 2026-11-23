import Link from "next/link";
import { notFound } from "next/navigation";
import { Textile } from "@/components/shop/Textile";
import { collectionBySlug, storefront } from "@/content/storefront";

export function generateStaticParams() {
  return storefront.collections.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = collectionBySlug(slug);
  return { title: item?.name ?? "Collection" };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = collectionBySlug(slug);
  if (!item) notFound();
  const swatches = ["Pallu", "Border", "Body", "Blouse"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/collections" className="text-sm text-rcs-red">
        All collections
      </Link>
      {item.slug === "silk" ? (
        <iframe
          title="The Silk Edit"
          src="/silk-saree-slideshow.html"
          className="mt-6 h-[100svh] min-h-[720px] w-full border-0 bg-[#211016]"
        />
      ) : (
        <>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{item.name}</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-clay">{item.blurb}</p>
      <p className="mt-2 text-sm">See this stack at Gandhi Circle, Holalu. We do not sell online.</p>
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {swatches.map((name) => (
            <li key={name} className="overflow-hidden rounded-2xl">
              <Textile hex={item.hex} label={name} patternKey={`${item.slug}-${name}`} />
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
