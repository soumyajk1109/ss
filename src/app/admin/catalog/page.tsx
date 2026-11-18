import type { Metadata } from "next";
import { categoryOptions, listCatalog } from "@/lib/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { PublishToggle } from "@/components/admin/PublishToggle";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Catalog" };

export default async function CatalogPage() {
  const session = await auth();
  const rows = await listCatalog();
  const options = await categoryOptions();
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 font-display text-5xl">Men, women, kids.</h1>
      </div>
      {session?.user?.role === "ADMIN" ? <ProductForm options={options.filter((option) => option.departmentSlug)} /> : null}
      <div className="overflow-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-clay">
            <tr>
              <th className="py-2">Piece</th>
              <th>Department</th>
              <th>HSN</th>
              <th>Available</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="py-3">
                  <span className="font-medium">{row.title}</span>
                  <span className="block text-xs text-clay">{row.category} · {row.skuCount} SKUs {row.low ? "· low" : ""}</span>
                </td>
                <td>{row.department}</td>
                <td>{row.hsnCode} · {row.gstRate}%</td>
                <td>{row.available}</td>
                <td>{session?.user?.role === "ADMIN" ? <PublishToggle id={row.id} published={row.isPublished} /> : row.isPublished ? "Live" : "Hidden"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
