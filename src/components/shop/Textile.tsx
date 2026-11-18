import { isLightHex } from "@/lib/utils";

const patterns = ["solid", "stripe", "check", "block", "ikat"] as const;
type PatternName = (typeof patterns)[number];

function patternFrom(seed: string): PatternName {
  let hash = 0;
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % patterns.length;
  return patterns[hash] ?? "solid";
}

export function Textile({
  hex,
  label,
  patternKey,
  badge,
  soldOut,
  large = false,
}: {
  hex: string;
  label: string;
  patternKey: string;
  badge?: string;
  soldOut?: boolean;
  large?: boolean;
}) {
  const ink = isLightHex(hex) ? "#1A1A1A" : "#FAF8F5";
  const pattern = patternFrom(patternKey);
  return (
    <div
      className={`relative overflow-hidden ring-1 ring-inset ring-charcoal/10 ${large ? "aspect-[4/5]" : "aspect-[3/4]"}`}
      style={{ backgroundColor: hex }}
    >
      <Pattern name={pattern} ink={ink} />
      {badge ? (
        <span className="absolute left-3 top-3 bg-turmeric px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal">
          {badge}
        </span>
      ) : null}
      {soldOut ? (
        <span className="absolute right-3 top-3 bg-charcoal px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
          Sold out
        </span>
      ) : null}
      <p className="absolute inset-x-0 bottom-0 p-4 font-display text-3xl leading-none md:text-4xl" style={{ color: ink }}>
        {label}
      </p>
    </div>
  );
}

function Pattern({ name, ink }: { name: PatternName; ink: string }) {
  if (name === "stripe") {
    return (
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: `repeating-linear-gradient(90deg, ${ink} 0 2px, transparent 2px 18px)` }}
      />
    );
  }
  if (name === "check") {
    return (
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `linear-gradient(${ink} 1px, transparent 1px), linear-gradient(90deg, ${ink} 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
    );
  }
  if (name === "block") {
    return (
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: `radial-gradient(${ink} 1.5px, transparent 1.8px)`, backgroundSize: "16px 16px" }}
      />
    );
  }
  if (name === "ikat") {
    return (
      <div
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: `repeating-linear-gradient(115deg, transparent 0 12px, ${ink}33 12px 16px)` }}
      />
    );
  }
  return null;
}
