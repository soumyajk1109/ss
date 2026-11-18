import type { Metadata } from "next";
import Link from "next/link";
import { dashboardStats } from "@/lib/admin";
import { formatInr, formatWhen } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome() {
  let stats: Awaited<ReturnType<typeof dashboardStats>> | null = null;
  try {
    stats = await dashboardStats();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return (
      <div>
        <h1 className="font-display text-4xl">Connect the database.</h1>
        {process.env.NODE_ENV !== "production" ? <pre className="mt-4 text-xs">{message}</pre> : null}
      </div>
    );
  }
  const cards = [
    ["Orders today", String(stats.ordersToday)],
    ["Revenue today", formatInr(stats.revenueTodayInr)],
    ["To pack", String(stats.openFulfillment)],
    ["Low stock", String(stats.lowStock)],
    ["Size holds", String(stats.activeHolds)],
  ];
  return (
    <div>
      <p className="eyebrow">Floor</p>
      <h1 className="mt-2 font-display text-5xl">Today in the atelier.</h1>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-line bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-clay">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <Link href="/admin/orders" className="btn-botanical">Orders</Link>
        <Link href="/admin/inventory" className="btn-line">Low stock</Link>
      </div>
      <ul className="mt-8 divide-y divide-line">
        {stats.recent.map((order) => (
          <li key={order.id} className="flex items-baseline justify-between gap-3 py-3 text-sm">
            <span>
              {order.orderNumber}
              <span className="ml-2 text-clay">{order.status}</span>
            </span>
            <span className="text-clay">{formatWhen(order.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
