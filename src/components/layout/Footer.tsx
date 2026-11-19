import Link from "next/link";
import { storefront } from "@/content/storefront";
import { brand } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-4xl">{storefront.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-clay">
            {brand.legalName}. Apparel for men, women, and kids in {brand.metros.join(", ")}.
          </p>
        </div>
        <div>
          <p className="eyebrow">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            {storefront.departments.map((department) => (
              <li key={department.href}><Link href={department.href}>{department.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Atelier</p>
          <ul className="mt-3 space-y-2 text-sm text-clay">
            {brand.addressLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
            <li>{brand.email}</li>
            <li>{brand.phone}</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-5 py-4 text-center text-xs text-clay">
        {storefront.footerNote}
      </p>
    </footer>
  );
}
