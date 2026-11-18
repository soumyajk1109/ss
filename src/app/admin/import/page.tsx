import type { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { CsvImportForm } from "@/components/admin/CsvImportForm";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Import stock" };

export default async function ImportPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");
  const sample = await readFile(path.join(process.cwd(), "data", "stock-import-sample.csv"), "utf8");
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Import</p>
        <h1 className="mt-2 font-display text-5xl">Bulk SKUs.</h1>
      </div>
      <CsvImportForm sample={sample} />
    </div>
  );
}
