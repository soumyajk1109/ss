import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/types";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/catalog", label: "Catalog", roles: ["ADMIN"] as Role[] },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/import", label: "Import", roles: ["ADMIN"] as Role[] },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth().catch(() => null);
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "FULFILLMENT") redirect("/account?next=/admin");
  const visible = links.filter((link) => !link.roles || link.roles.includes(role));
  return (
    <div className="min-h-screen bg-paper">
      <header className="no-print border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/admin" className="font-display text-3xl">SS floor</Link>
          <Link href="/" className="text-sm underline">Storefront</Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-4 overflow-auto px-5 pb-3 text-sm">
          {visible.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-full border border-line px-3 py-1.5">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </div>
  );
}
