"use client";

import { Minus, Plus, Ruler } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PincodeChecker } from "@/components/product/PincodeChecker";
import { SizeGuide } from "@/components/product/SizeGuide";
import { emitCartChange } from "@/lib/cart-events";
import type { SizeType } from "@/lib/types";
import { formatInr } from "@/lib/utils";

type Variant = {
  id: string;
  sku: string;
  sizeType: SizeType;
  sizeValue: string;
  colorName: string;
  colorHex: string;
  mrpInr: number;
  sellingPriceInr: number;
  available: number;
};

export function BuyBox({
  title,
  department,
  hsnCode,
  gstRate,
  variants,
}: {
  title: string;
  department: string;
  hsnCode: string;
  gstRate: number;
  variants: Variant[];
}) {
  const router = useRouter();
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const variant of variants) map.set(variant.colorName, variant.colorHex);
    return [...map.entries()].map(([name, hex]) => ({ name, hex }));
  }, [variants]);
  const [color, setColor] = useState(colors[0]?.name ?? "");
  const sized = variants.filter((variant) => variant.colorName === color);
  const [variantId, setVariantId] = useState(sized.find((variant) => variant.available > 0)?.id ?? sized[0]?.id ?? "");
  const selected = variants.find((variant) => variant.id === variantId) ?? sized[0];
  const [qty, setQty] = useState(1);
  const [guide, setGuide] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function chooseColor(next: string) {
    setColor(next);
    const options = variants.filter((variant) => variant.colorName === next);
    setVariantId((options.find((variant) => variant.available > 0) ?? options[0])?.id ?? "");
    setQty(1);
  }

  async function add(goToCheckout: boolean) {
    if (!selected || selected.available < 1) return;
    setPending(true);
    setMessage("");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId: selected.id, quantity: qty }),
    });
    const data = (await res.json()) as { error?: string };
    setPending(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not add this to the bag.");
      return;
    }
    emitCartChange();
    if (goToCheckout) router.push("/checkout");
    else {
      setMessage("Added to the bag.");
      router.refresh();
    }
  }

  if (!selected) return <p>This piece has no sizes online yet.</p>;
  const off = selected.mrpInr > selected.sellingPriceInr ? Math.round((1 - selected.sellingPriceInr / selected.mrpInr) * 100) : 0;

  return (
    <div>
      <p className="text-2xl">
        <span className="font-medium">{formatInr(selected.sellingPriceInr)}</span>
        {selected.mrpInr > selected.sellingPriceInr ? (
          <span className="ml-2 text-base text-clay line-through">{formatInr(selected.mrpInr)}</span>
        ) : null}
        {off > 0 ? <span className="ml-2 bg-turmeric px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">-{off}%</span> : null}
      </p>
      <p className="mt-1 text-sm text-clay">
        Inclusive of {gstRate}% GST · HSN {hsnCode}
      </p>
      <p className="mt-1 text-xs text-clay">MRP is the maximum retail price. You pay the selling price.</p>

      <div className="mt-6">
        <p className="eyebrow">Colour · {color}</p>
        <div className="mt-3 flex gap-2">
          {colors.map((swatch) => (
            <button
              key={swatch.name}
              type="button"
              aria-label={swatch.name}
              aria-pressed={swatch.name === color}
              onClick={() => chooseColor(swatch.name)}
              className={`h-8 w-8 rounded-full border ${swatch.name === color ? "border-charcoal ring-2 ring-turmeric ring-offset-2" : "border-charcoal/20"}`}
              style={{ background: swatch.hex }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Size · {selected.sizeValue}</p>
          <button type="button" className="inline-flex items-center gap-1 text-sm text-botanical" onClick={() => setGuide(true)}>
            <Ruler className="h-4 w-4" />
            Size guide
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {sized.map((variant) => (
            <button
              key={variant.id}
              type="button"
              disabled={variant.available < 1}
              onClick={() => {
                setVariantId(variant.id);
                setQty(1);
              }}
              className={`min-w-14 rounded-full border px-3 py-2 text-sm ${variant.id === selected.id ? "border-botanical bg-botanical text-paper" : "border-line"} disabled:text-clay/40`}
            >
              {variant.sizeValue}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-clay">
          {selected.available <= 0 ? "Sold out in this size." : selected.available <= 5 ? `Only ${selected.available} left.` : "In stock."} SKU {selected.sku}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-line">
          <button type="button" className="px-3 py-2" aria-label="Decrease quantity" onClick={() => setQty((value) => Math.max(1, value - 1))}>
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center text-sm">{qty}</span>
          <button
            type="button"
            className="px-3 py-2"
            aria-label="Increase quantity"
            onClick={() => setQty((value) => Math.min(10, selected.available, value + 1))}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-clay">We hold the size for 15 minutes once you check out.</p>
      </div>

      <div className="mt-6 hidden gap-3 md:flex">
        <button type="button" className="btn-botanical flex-1" disabled={pending || selected.available < 1} onClick={() => add(false)}>
          Add to bag
        </button>
        <button type="button" className="btn-turmeric flex-1" disabled={pending || selected.available < 1} onClick={() => add(true)}>
          Buy now
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-16 z-30 flex gap-2 border-t border-line bg-paper/95 p-3 backdrop-blur md:hidden">
        <button type="button" className="btn-botanical flex-1" disabled={pending || selected.available < 1} onClick={() => add(false)}>
          Add to bag
        </button>
        <button type="button" className="btn-turmeric flex-1" disabled={pending || selected.available < 1} onClick={() => add(true)}>
          Buy
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-botanical">{message}</p> : null}
      <div className="mt-8">
        <PincodeChecker />
      </div>
      <p className="sr-only">{title}</p>
      <SizeGuide open={guide} onClose={() => setGuide(false)} department={department} sizeType={selected.sizeType} />
    </div>
  );
}
