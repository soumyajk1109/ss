import type { Metadata } from "next";
import { lowStockRows, recentLogs } from "@/lib/admin";
import { InventoryAdjust } from "@/components/admin/InventoryAdjust";
import { formatWhen } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const [low, logs] = await Promise.all([lowStockRows(), recentLogs()]);
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Inventory</p>
        <h1 className="mt-2 font-display text-5xl">Holds, sales, counts.</h1>
      </div>
      <InventoryAdjust />
      <section>
        <h2 className="font-display text-3xl">Low stock</h2>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-clay">
              <tr><th className="py-2">SKU</th><th>Piece</th><th>On hand</th><th>Reserved</th><th>Free</th></tr>
            </thead>
            <tbody>
              {low.map((row) => (
                <tr key={row.sku} className="border-t border-line">
                  <td className="py-3 font-medium">{row.sku}</td>
                  <td>{row.title}<span className="block text-xs text-clay">{row.department} · {row.sizeValue} / {row.colorName}</span></td>
                  <td>{row.stockQuantity}</td>
                  <td>{row.reservedQuantity}</td>
                  <td>{row.stockQuantity - row.reservedQuantity}</td>
                </tr>
              ))}
              {!low.length ? <tr><td className="py-4 text-clay" colSpan={5}>No SKU is at or under its threshold.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="font-display text-3xl">Ledger</h2>
        <ul className="mt-4 divide-y divide-line text-sm">
          {logs.map((log) => (
            <li key={log.id} className="grid gap-1 py-3 md:grid-cols-[8rem_1fr_auto]">
              <span className="font-medium">{log.action}</span>
              <span>{log.sku} · {log.quantity} · on hand {log.stockAfter} · reserved {log.reservedAfter}{log.orderNumber ? ` · ${log.orderNumber}` : ""}{log.note ? ` · ${log.note}` : ""}</span>
              <span className="text-clay">{formatWhen(log.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
