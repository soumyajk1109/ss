"use client";

import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchBox } from "@/components/shop/SearchBox";
import { storefront } from "@/content/storefront";
import type { NavDepartment } from "@/lib/types";

export function Header({ nav }: { nav: NavDepartment[] }) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let stop = false;
    async function load() {
      const res = await fetch("/api/cart");
      const data = (await res.json()) as { count?: number };
      if (!stop) setCount(data.count ?? 0);
    }
    void load();
    const onChange = () => void load();
    window.addEventListener("ss-cart", onChange);
    return () => {
      stop = true;
      window.removeEventListener("ss-cart", onChange);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-5">
        <button type="button" className="md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu />
        </button>
        <Link href="/" className="font-display text-3xl leading-none tracking-tight">
          {storefront.name}
        </Link>
        <nav className="ml-6 hidden items-center gap-6 md:flex" aria-label="Departments">
          {nav.map((department) => (
            <div
              key={department.slug}
              className="relative"
              onMouseEnter={() => setActive(department.slug)}
              onMouseLeave={() => setActive(null)}
            >
              <Link href={`/shop/${department.slug}`} className="text-sm uppercase tracking-[0.18em]">
                {department.name}
              </Link>
              {active === department.slug && department.categories.length ? (
                <div className="absolute left-1/2 top-full z-40 w-[40rem] -translate-x-1/2 pt-4">
                  <div className="grid grid-cols-3 gap-6 rounded-3xl border border-line bg-paper p-6 shadow-sm">
                    {department.categories.map((category) => (
                      <div key={category.slug}>
                        <Link href={`/shop/${department.slug}/${category.slug}`} className="text-xs uppercase tracking-[0.16em] text-botanical">
                          {category.name}
                        </Link>
                        <ul className="mt-2 space-y-1">
                          {category.children.map((child) => (
                            <li key={child.slug}>
                              <Link href={`/shop/${department.slug}/${child.slug}`} className="text-sm hover:text-botanical">
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </nav>
        <div className="ml-auto hidden flex-1 justify-end md:flex">
          <SearchBox />
        </div>
        <button type="button" className="ml-auto md:ml-2 md:hidden" aria-label="Search" onClick={() => setSearching((value) => !value)}>
          <Search />
        </button>
        <Link href="/account" aria-label="Account" className="hidden md:inline-flex">
          <UserRound />
        </Link>
        <Link href="/cart" aria-label={`Bag, ${count} items`} className="relative">
          <ShoppingBag />
          {count > 0 ? (
            <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-turmeric px-1 text-[10px] font-semibold">
              {count}
            </span>
          ) : null}
        </Link>
      </div>
      {searching ? (
        <div className="border-t border-line px-4 py-3 md:hidden">
          <SearchBox compact />
        </div>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-botanical px-5 py-6 text-paper md:hidden">
          <div className="flex items-center justify-between">
            <p className="font-display text-4xl">{storefront.name}</p>
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>
          <div className="mt-8 space-y-8">
            {nav.map((department) => (
              <div key={department.slug}>
                <Link href={`/shop/${department.slug}`} onClick={() => setOpen(false)} className="font-display text-4xl">
                  {department.name}
                </Link>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-paper/80">
                  {department.categories.map((category) => (
                    <Link key={category.slug} href={`/shop/${department.slug}/${category.slug}`} onClick={() => setOpen(false)}>
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
