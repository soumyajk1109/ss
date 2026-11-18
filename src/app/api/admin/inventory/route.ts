import { adjustStock, StockError } from "@/lib/inventory";
import { requireRole } from "@/lib/guards";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { stockAdjustSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const gate = await requireRole(["ADMIN", "FULFILLMENT"]);
  if (gate.response) return gate.response;
  const parsed = stockAdjustSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Check the SKU and quantity." }, 400);
  if (parsed.data.mode === "add" && parsed.data.quantity === 0) {
    return json({ error: "Add a quantity greater than zero." }, 400);
  }
  try {
    const result = await adjustStock({ ...parsed.data, actorId: gate.session!.user.id });
    return json(result);
  } catch (error) {
    if (error instanceof StockError) {
      const status = error.code === "NOT_FOUND" ? 404 : 409;
      return json({ error: error.message }, status);
    }
    console.error(error);
    return json({ error: "Could not adjust stock." }, 500);
  }
}
