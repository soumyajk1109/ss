"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { emitCartChange } from "@/lib/cart-events";
import type { CartLine } from "@/lib/types";
import { formatInr } from "@/lib/utils";

export function CartView({ lines, subtotal }: { lines: CartLine[]; subtotal: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function update(variantId: string, quantity: number) {
    setPending(variantId);
    setError("");
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
    });
    const data = (await res.json()) as { error?: string };
    setPending(null);
    if (!res.ok) {
      setError(data.error ?? "Could not update the bag.");
      return;
    }
    emitCartChange();
    router.refresh();
  }

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="eyebrow">Bag</p>
        <h1 className="mt-2 font-display text-5xl">Nothing in the bag.</h1>
        <Link href="/shop" className="btn-botanical mt-6">
          Shop the edit
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-[1fr_20rem]">
      <div>
        <p className="eyebrow">Bag</p>
        <h1 className="mt-2 font-display text-5xl">Ready when you are.</h1>
        <ul className="mt-8 divide-y divide-line">
          {lines.map((line) => (
            <li key={line.variantId} className="flex gap-4 py-5">
              <span className="h-20 w-16 shrink-0 rounded-xl" style={{ background: line.colorHex }} />
              <div className="min-w-0 flex-1">
                <Link href={`/product/${line.slug}`} className="font-display text-2xl leading-none">
                  {line.title}
                </Link>
                <p className="mt-1 text-sm text-clay">
                  {line.colorName} · {line.sizeValue} · {line.sku}
                </p>
                {!line.published || line.available < line.quantity ? (
                  <p className="mt-1 text-sm text-botanical">Only {line.available} available now.</p>
                ) : null}
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" aria-label="Decrease" disabled={pending === line.variantId} onClick={() => update(line.variantId, line.quantity - 1)}>
                    <Minus className="h-4 w-4" />
                  </button>
                  <span>{line.quantity}</span>
                  <button type="button" aria-label="Increase" disabled={pending === line.variantId} onClick={() => update(line.variantId, line.quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Remove" className="ml-auto" onClick={() => update(line.variantId, 0)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium">{formatInr(line.lineTotalInr)}</p>
            </li>
          ))}
        </ul>
        {error ? <p className="text-sm text-botanical">{error}</p> : null}
      </div>
      <aside className="h-fit rounded-3xl border border-line bg-white p-5">
        <p className="eyebrow">Summary</p>
        <p className="mt-4 flex justify-between text-sm">
          <span>Merchandise</span>
          <span>{formatInr(subtotal)}</span>
        </p>
        <p className="mt-2 text-xs leading-5 text-clay">Shipping and the COD fee are calculated from your pincode. GST is already inside these prices.</p>
        <Link href="/checkout" className="btn-botanical mt-5 w-full">
          Checkout
        </Link>
      </aside>
    </div>
  );
}
