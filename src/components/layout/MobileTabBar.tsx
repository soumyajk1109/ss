"use client";

import { House, Search, ShoppingBag, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: House },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/search", label: "Search", icon: Search },
  { href: "/cart", label: "Bag", icon: ShoppingBag },
  { href: "/account", label: "Account", icon: UserRound },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur md:hidden" aria-label="Primary">
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link href={tab.href} className={`flex flex-col items-center gap-1 py-2 text-[10px] uppercase tracking-[0.14em] ${active ? "text-botanical" : "text-clay"}`}>
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
