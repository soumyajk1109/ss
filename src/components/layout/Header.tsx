import { Phone } from "lucide-react";
import Link from "next/link";
import { storefront } from "@/content/storefront";

export function Header({ phone }: { phone: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 md:px-5">
        <Link href="/" className="min-w-0">
          <img src={storefront.logo} alt="RCS Clothing" className="h-14 w-auto object-contain mix-blend-multiply md:h-16" />
        </Link>
        <a href={`tel:${phone.replace(/\s/g, "")}`} aria-label="Call the store" className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-rcs-gold text-charcoal">
          <Phone className="h-5 w-5" />
        </a>
      </div>
    </header>
  );
}
