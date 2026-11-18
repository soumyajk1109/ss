"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function InventoryAdjust() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sku: String(form.get("sku") ?? ""),
        quantity: Number(form.get("quantity")),
        mode: String(form.get("mode") ?? "add"),
        note: String(form.get("note") ?? ""),
      }),
    });
    const data = (await res.json()) as { error?: string; stockQuantity?: number; sku?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not adjust stock.");
      return;
    }
    setMessage(`${data.sku} now has ${data.stockQuantity} on hand.`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-line bg-white p-5 md:grid-cols-4">
      <input name="sku" required placeholder="SKU" className="field" />
      <input name="quantity" required type="number" min={0} placeholder="Quantity" className="field" />
      <select name="mode" className="field">
        <option value="add">Add</option>
        <option value="set">Set on-hand</option>
      </select>
      <input name="note" placeholder="Note" className="field" />
      <button className="btn-botanical md:col-span-4" disabled={pending}>Update stock</button>
      {error ? <p className="text-sm md:col-span-4">{error}</p> : null}
      {message ? <p className="text-sm text-botanical md:col-span-4">{message}</p> : null}
    </form>
  );
}
