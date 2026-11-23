"use client";

import { ChevronDown, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { storefront } from "@/content/storefront";

export function Header({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
    setCollectionsOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 md:px-5">
        <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center text-charcoal">
          <Menu />
        </button>
        <Link href="/" className="min-w-0" onClick={close}>
          <img src={storefront.logo} alt="RCS Clothing" className="h-14 w-auto object-contain mix-blend-multiply md:h-16" />
        </Link>
        <a href={`tel:${phone.replace(/\s/g, "")}`} aria-label="Call the store" className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-rcs-gold text-charcoal">
          <Phone className="h-5 w-5" />
        </a>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-paper px-5 py-6 text-charcoal">
          <div className="flex items-center justify-between">
            <img src={storefront.logo} alt="" className="h-12 w-auto object-contain mix-blend-multiply" />
            <button type="button" aria-label="Close menu" onClick={close}>
              <X />
            </button>
          </div>
          <nav className="mt-10 space-y-2" aria-label="Options">
            <Link href="/" onClick={close} className="block py-3 font-display text-4xl">
              Home
            </Link>
            <button
              type="button"
              className="flex w-full items-center justify-between py-3 text-left font-display text-4xl text-rcs-red"
              aria-expanded={collectionsOpen}
              onClick={() => setCollectionsOpen((value) => !value)}
            >
              Collections
              <ChevronDown className={`h-7 w-7 transition ${collectionsOpen ? "rotate-180" : ""}`} />
            </button>
            {collectionsOpen ? (
              <ul className="space-y-1 pb-3 pl-1">
                {storefront.collections.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/collections/${item.slug}`} onClick={close} className="block rounded-2xl px-3 py-3 text-lg hover:bg-white">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href="/#visit" onClick={close} className="block py-3 font-display text-4xl">
              Visit
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
