"use client";

import { House, LayoutGrid, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: House },
  { href: "/collections", label: "Collections", icon: LayoutGrid },
  { href: "/#visit", label: "Visit", icon: MapPin },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper md:hidden" aria-label="Primary">
      <ul className="grid grid-cols-3">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link href={tab.href} className={`flex flex-col items-center gap-1 border-t-2 py-2 text-[11px] ${active ? "border-rcs-red text-charcoal" : "border-transparent text-clay"}`}>
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
