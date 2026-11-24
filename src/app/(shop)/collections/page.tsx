import { Textile } from "@/components/shop/Textile";
import { storefront } from "@/content/storefront";

export const metadata = { title: "Collections" };

export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-[0.22em] text-rcs-red">RCS Clothing</p>
      <h1 className="mt-2 font-display text-4xl">Saree collections</h1>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {storefront.collections.map((item) => (
          <li key={item.slug}>
            <div className="overflow-hidden rounded-2xl">
              <Textile hex={item.hex} label={item.name} patternKey={item.slug} image={"image" in item ? item.image : undefined} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
