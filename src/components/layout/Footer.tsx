import Link from "next/link";
import { brand } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-4xl">SS</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-clay">
            {brand.legalName}. Apparel for men, women, and kids in {brand.metros.join(", ")}.
          </p>
        </div>
        <div>
          <p className="eyebrow">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/shop/men">Men</Link></li>
            <li><Link href="/shop/women">Women</Link></li>
            <li><Link href="/shop/kids">Kids</Link></li>
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
        Prices include GST. UPI, cards, net banking, wallets, EMI, and cash on delivery where the pincode allows it.
      </p>
    </footer>
  );
}
