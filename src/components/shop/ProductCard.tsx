import Link from "next/link";
import { Textile } from "@/components/shop/Textile";
import type { ListingProduct } from "@/lib/types";
import { formatInr } from "@/lib/utils";

export function ProductCard({ product }: { product: ListingProduct }) {
  const off = product.mrpInr > product.priceInr ? Math.round((1 - product.priceInr / product.mrpInr) * 100) : 0;
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-[1.01]">
        <Textile
          hex={product.swatch}
          label={product.category}
          patternKey={product.slug}
          badge={off > 0 ? `-${off}%` : undefined}
          soldOut={product.available <= 0}
        />
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-clay">{product.department}</p>
      <h2 className="mt-1 font-display text-xl leading-tight group-hover:text-botanical">{product.title}</h2>
      {product.fabric ? <p className="mt-1 text-xs text-clay">{product.fabric}</p> : null}
      <p className="mt-2 text-sm">
        <span className="font-medium">{formatInr(product.priceInr)}</span>
        {product.mrpInr > product.priceInr ? (
          <span className="ml-2 text-clay line-through">{formatInr(product.mrpInr)}</span>
        ) : null}
      </p>
      <div className="mt-2 flex gap-1.5">
        {product.colors.slice(0, 5).map((color) => (
          <span
            key={color.name}
            title={color.name}
            className="h-3.5 w-3.5 rounded-full border border-charcoal/15"
            style={{ background: color.hex }}
          />
        ))}
      </div>
    </Link>
  );
}
