import Link from "next/link";
import { storefront } from "@/content/storefront";
import { brand } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
        <div>
          <img src={storefront.logo} alt="RCS Clothing" className="h-16 w-auto object-contain mix-blend-multiply" />
        </div>
        <div>
          <p className="text-sm font-semibold">Collections</p>
          <ul className="mt-3 space-y-2 text-sm">
            {storefront.collections.map((item) => (
              <li key={item.slug}>
                <Link href={`/collections/${item.slug}`}>{item.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Address</p>
          <ul className="mt-3 space-y-2 text-sm text-clay">
            <li>{brand.legalName}</li>
            <li>{brand.addressLines.join(", ")}</li>
            <li>{brand.phone}</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-5 py-4 text-center text-xs text-clay">{storefront.footerNote}</p>
    </footer>
  );
}
