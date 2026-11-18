"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

type Result = {
  serviceable: boolean;
  error?: string;
  city?: string;
  state?: string;
  metro?: string;
  etaMinDays?: number;
  etaMaxDays?: number;
  shippingInr?: number;
  codAvailable?: boolean;
};

export function PincodeChecker({ onResolved }: { onResolved?: (result: Result | null) => void }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);

  async function check(value: string) {
    if (!/^[1-9][0-9]{5}$/.test(value)) {
      setResult(null);
      onResolved?.(null);
      return;
    }
    setPending(true);
    const res = await fetch(`/api/pincode?code=${value}`);
    const data = (await res.json()) as Result;
    setResult(data);
    onResolved?.(data);
    setPending(false);
  }

  return (
    <div>
      <label className="eyebrow" htmlFor="pincode">
        Delivery pincode
      </label>
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clay" />
          <input
            id="pincode"
            inputMode="numeric"
            maxLength={6}
            value={code}
            placeholder="400001"
            className="field pl-10"
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(value);
              if (value.length === 6) void check(value);
              else {
                setResult(null);
                onResolved?.(null);
              }
            }}
          />
        </div>
      </div>
      <p className="mt-2 min-h-5 text-sm text-clay" aria-live="polite">
        {pending
          ? "Checking the route…"
          : result?.serviceable
            ? `${result.city}, ${result.state} · ${result.etaMinDays}–${result.etaMaxDays} days · ${result.codAvailable ? "COD available" : "prepaid only"}`
            : result?.error || "Metro delivery across seven cities."}
      </p>
    </div>
  );
}
