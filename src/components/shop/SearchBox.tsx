"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type Hit = { title: string; slug: string; department: string; fabric: string | null };

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { results?: Hit[] };
      setHits(data.results ?? []);
      setOpen(true);
    }, 220);
    return () => clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, []);

  return (
    <div ref={box} className={`relative ${compact ? "w-full" : "w-full max-w-md"}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (q.trim().length < 2) return;
          setOpen(false);
          router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <label className="sr-only" htmlFor={`${listId}-input`}>
          Search SS
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clay" />
        <input
          id={`${listId}-input`}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onFocus={() => hits.length && setOpen(true)}
          placeholder="Search kurtas, silk, school-run"
          className="field pl-10 pr-10"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
        />
        {q ? (
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-clay" onClick={() => setQ("")} aria-label="Clear search">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </form>
      {open && hits.length ? (
        <ul id={listId} role="listbox" className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          {hits.map((hit) => (
            <li key={hit.slug}>
              <button
                type="button"
                className="flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left hover:bg-paper"
                onClick={() => {
                  setOpen(false);
                  router.push(`/product/${hit.slug}`);
                }}
              >
                <span className="font-medium">{hit.title}</span>
                <span className="text-xs uppercase tracking-[0.14em] text-clay">{hit.department}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
