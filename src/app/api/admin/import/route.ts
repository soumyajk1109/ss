import { adjustStock, StockError } from "@/lib/inventory";
import { parseCsv } from "@/lib/csv";
import { requireRole } from "@/lib/guards";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { csvImportSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const gate = await requireRole(["ADMIN"]);
  if (gate.response) return gate.response;
  const parsed = csvImportSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Paste a CSV with sku, quantity, and mode." }, 400);
  const rows = parseCsv(parsed.data.csv);
  if (!rows.length) return json({ error: "The CSV has no data rows." }, 400);
  if (rows.length > 1000) return json({ error: "Import up to 1,000 rows at a time." }, 400);

  const seen = new Set<string>();
  const plan: { sku: string; quantity: number; mode: "add" | "set"; line: number }[] = [];
  for (const entry of rows) {
    const sku = entry.row.sku ?? "";
    const mode = (entry.row.mode || "add").toLowerCase();
    const quantity = Number(entry.row.quantity);
    if (!sku || (mode !== "add" && mode !== "set") || !Number.isInteger(quantity) || quantity < 0) {
      return json({ error: `Row ${entry.line} needs sku, a whole quantity, and mode add or set.` }, 400);
    }
    if (seen.has(sku)) return json({ error: `SKU ${sku} is repeated. Keep one row per SKU.` }, 400);
    seen.add(sku);
    plan.push({ sku, quantity, mode, line: entry.line });
  }

  const applied: { sku: string; stockQuantity: number }[] = [];
  try {
    for (const row of [...plan].sort((a, b) => a.sku.localeCompare(b.sku))) {
      const result = await adjustStock({
        sku: row.sku,
        quantity: row.quantity,
        mode: row.mode,
        note: `csv_import line ${row.line} by:${gate.session!.user.id}`,
        actorId: gate.session!.user.id,
      });
      applied.push({ sku: result.sku, stockQuantity: result.stockQuantity });
    }
  } catch (error) {
    if (error instanceof StockError) {
      return json({ error: error.message, applied }, error.code === "NOT_FOUND" ? 404 : 409);
    }
    console.error(error);
    return json({ error: "Import stopped.", applied }, 500);
  }
  return json({ updated: applied.length, applied });
}
