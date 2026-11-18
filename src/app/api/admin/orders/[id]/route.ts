import { transitionOrder, StockError } from "@/lib/inventory";
import { requireRole } from "@/lib/guards";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { orderStatusSchema } from "@/lib/validators";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const gate = await requireRole(["ADMIN", "FULFILLMENT"]);
  if (gate.response) return gate.response;
  const parsed = orderStatusSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Choose a fulfilment status." }, 400);
  const { id } = await context.params;
  try {
    await transitionOrder(id, parsed.data.status, gate.session!.user.id);
    return json({ ok: true });
  } catch (error) {
    if (error instanceof StockError) {
      const status = error.code === "NOT_FOUND" ? 404 : 409;
      return json({ error: error.message }, status);
    }
    console.error(error);
    return json({ error: "Could not update the order." }, 500);
  }
}
