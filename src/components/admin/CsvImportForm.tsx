"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CsvImportForm({ sample }: { sample: string }) {
  const router = useRouter();
  const [csv, setCsv] = useState(sample);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = (await res.json()) as { error?: string; updated?: number };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Import failed.");
      return;
    }
    setMessage(`Updated ${data.updated} SKUs.`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea className="field min-h-64 font-mono text-xs" value={csv} onChange={(event) => setCsv(event.target.value)} aria-label="CSV" />
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) setCsv(await file.text());
        }}
      />
      <button className="btn-botanical" disabled={pending}>Import</button>
      {error ? <p className="text-sm">{error}</p> : null}
      {message ? <p className="text-sm text-botanical">{message}</p> : null}
      <p className="text-xs leading-5 text-clay">Columns: sku, quantity, mode. mode is add or set. A failed row stops the import; earlier rows are already saved. set cannot drop on-hand stock below the reserved hold.</p>
    </form>
  );
}
