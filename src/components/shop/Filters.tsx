"use client";

import { SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Facets } from "@/lib/catalog";
import type { SizeType } from "@/lib/types";
import { formatInr } from "@/lib/utils";

export function Filters({
  facets,
  current,
}: {
  facets: Facets;
  current: {
    color?: string;
    fabric?: string;
    sizeType?: string;
    min?: string;
    max?: string;
    inStock?: boolean;
    sort?: string;
    priced?: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const panel = (
    <FilterFields facets={facets} current={current} onDone={() => setOpen(false)} />
  );
  return (
    <>
      <div className="mb-4 flex items-center justify-between md:hidden">
        <button type="button" className="btn-line px-4 py-2" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>
      <aside className="hidden md:block">{panel}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-paper px-5 py-6 md:hidden">
          <div className="mb-6 flex items-center justify-between">
            <p className="font-display text-3xl">Filters</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close filters">
              <X />
            </button>
          </div>
          {panel}
        </div>
      ) : null}
    </>
  );
}

function FilterFields({
  facets,
  current,
  onDone,
}: {
  facets: Facets;
  current: {
    color?: string;
    fabric?: string;
    sizeType?: string;
    min?: string;
    max?: string;
    inStock?: boolean;
    sort?: string;
    priced?: boolean;
  };
  onDone: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [min, setMin] = useState(Number(current.min ?? 0));
  const [max, setMax] = useState(Number(current.max ?? 20000));

  function push(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = {
      color: current.color,
      fabric: current.fabric,
      sizeType: current.sizeType,
      sort: current.sort,
      inStock: current.inStock ? "1" : undefined,
      min: current.priced ? current.min : undefined,
      max: current.priced ? current.max : undefined,
      priced: current.priced ? "1" : undefined,
      ...next,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    onDone();
  }

  return (
    <div className="space-y-7 text-sm">
      <label className="block">
        <span className="eyebrow">Sort</span>
        <select
          className="field mt-2"
          value={current.sort ?? "newest"}
          onChange={(event) => push({ sort: event.target.value === "newest" ? undefined : event.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price, low to high</option>
          <option value="price_desc">Price, high to low</option>
        </select>
      </label>

      <fieldset>
        <legend className="eyebrow">Size type</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip active={!current.sizeType} onClick={() => push({ sizeType: undefined })}>
            Any
          </Chip>
          {facets.sizeTypes.map((size) => (
            <Chip key={size} active={current.sizeType === size} onClick={() => push({ sizeType: size as SizeType })}>
              {labelSize(size)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Colour</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip active={!current.color} onClick={() => push({ color: undefined })}>
            Any
          </Chip>
          {facets.colors.map((color) => (
            <button
              key={color.name}
              type="button"
              aria-pressed={current.color === color.name}
              onClick={() => push({ color: current.color === color.name ? undefined : color.name })}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${current.color === color.name ? "border-botanical" : "border-line"}`}
            >
              <span className="h-3 w-3 rounded-full border border-charcoal/15" style={{ background: color.hex }} />
              {color.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Fabric</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip active={!current.fabric} onClick={() => push({ fabric: undefined })}>
            Any
          </Chip>
          {facets.fabrics.map((fabric) => (
            <Chip key={fabric} active={current.fabric === fabric} onClick={() => push({ fabric: current.fabric === fabric ? undefined : fabric })}>
              {fabric}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Price</legend>
        <div className="mt-3 space-y-3">
          <input type="range" min={0} max={20000} step={100} value={max} onChange={(event) => setMax(Number(event.target.value))} className="w-full accent-botanical" aria-label="Maximum price" />
          <div className="flex justify-between text-xs text-clay">
            <span>{formatInr(min)}</span>
            <span>{formatInr(max)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="field" type="number" min={0} value={min} onChange={(event) => setMin(Number(event.target.value))} aria-label="Minimum price" />
            <input className="field" type="number" min={0} value={max} onChange={(event) => setMax(Number(event.target.value))} aria-label="Maximum price amount" />
          </div>
          <button
            type="button"
            className="btn-botanical w-full"
            onClick={() => {
              const low = Math.min(min, max);
              const high = Math.max(min, max);
              push({ min: String(low), max: String(high), priced: "1" });
            }}
          >
            Apply price
          </button>
        </div>
      </fieldset>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(current.inStock)}
          onChange={(event) => push({ inStock: event.target.checked ? "1" : undefined })}
        />
        In stock only
      </label>

      <button type="button" className="text-sm underline" onClick={() => router.push(pathname)}>
        Clear filters
      </button>
    </div>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 ${active ? "border-botanical bg-botanical text-paper" : "border-line"}`}>
      {children}
    </button>
  );
}

function labelSize(size: SizeType) {
  if (size === "ALPHA") return "Alpha";
  if (size === "NUMERIC") return "Numeric";
  return "Kids age";
}
