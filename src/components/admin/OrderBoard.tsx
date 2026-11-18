"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@/lib/types";
import { formatInr, formatWhen } from "@/lib/utils";

type Row = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  totalInr: number;
  city: string;
  placeOfSupply: string;
  pieces: number;
  createdAt: string;
  invoiceReady: boolean;
};

const NEXT: Record<string, string[]> = {
  RESERVED: ["CANCELLED"],
  COD_PENDING: ["CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
};

export function OrderBoard({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function move(id: string, status: string) {
    setError("");
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not update the order.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="overflow-auto">
      {error ? <p className="mb-3 text-sm">{error}</p> : null}
      <table className="w-full min-w-[48rem] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-[0.14em] text-clay">
          <tr>
            <th className="py-2">Order</th>
            <th>City</th>
            <th>Pay</th>
            <th>Status</th>
            <th>Total</th>
            <th>When</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line">
              <td className="py-3">
                <span className="font-medium">{row.orderNumber}</span>
                <span className="block text-xs text-clay">{row.pieces} pcs</span>
              </td>
              <td>{row.city}<span className="block text-xs text-clay">{row.placeOfSupply}</span></td>
              <td>{row.paymentMethod}<span className="block text-xs text-clay">{row.paymentStatus}</span></td>
              <td>
                <span className="rounded-full bg-sand px-2 py-1 text-xs">{row.status}</span>
                {NEXT[row.status]?.length ? (
                  <select className="mt-2 block rounded-full border border-line bg-white px-2 py-1 text-xs" defaultValue="" onChange={(event) => { if (event.target.value) void move(row.id, event.target.value); }}>
                    <option value="">Move to…</option>
                    {NEXT[row.status]!.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : null}
              </td>
              <td>{formatInr(row.totalInr)}</td>
              <td className="text-clay">{formatWhen(row.createdAt)}</td>
              <td>{row.invoiceReady ? <Link className="underline" href={`/admin/invoices/${row.id}`}>Invoice</Link> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
