import type { Metadata } from "next";
import Link from "next/link";
import { AccountPanel } from "@/components/account/AccountPanel";
import { SignOutButton } from "@/components/account/SignOutButton";
import { auth } from "@/lib/auth";
import { ordersForUser } from "@/lib/orders";
import { formatInr, formatWhen, oneParam, safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNextPath(oneParam((await searchParams).next), "/account");
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return <AccountPanel next={next === "/account" ? "/account" : next} />;
  const orders = await ordersForUser(session.user.id).catch(() => []);
  const staff = session.user.role === "ADMIN" || session.user.role === "FULFILLMENT";
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="eyebrow">{session.user.role}</p>
      <h1 className="mt-2 font-display text-5xl">{session.user.name || "Your SS account"}</h1>
      <p className="mt-2 text-sm text-clay">{session.user.email || session.user.phone || "Signed in"}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {staff ? <Link href="/admin" className="btn-botanical">Admin</Link> : null}
        <SignOutButton />
      </div>
      <h2 className="mt-12 font-display text-3xl">Orders</h2>
      {orders.length ? (
        <ul className="mt-4 divide-y divide-line">
          {orders.map((order) => (
            <li key={order.id} className="flex items-baseline justify-between gap-4 py-4">
              <Link href={`/orders/${order.orderNumber}?t=${order.accessToken}`}>
                <span className="font-medium">{order.orderNumber}</span>
                <span className="mt-1 block text-sm text-clay">{formatWhen(order.createdAt)} · {order.status}</span>
              </Link>
              <span className="text-sm">{formatInr(order.totalInr)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-clay">Orders placed while signed in show up here. Guest orders stay on the confirmation link.</p>
      )}
    </div>
  );
}
