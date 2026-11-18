import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { cartCount, cartSubtotal, ensureCart, getCartLines, readCartId } from "@/lib/cart";
import { getDb } from "@/lib/db";
import { cartItems, productVariants } from "@/lib/db/schema";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { cartAddSchema, cartSetSchema } from "@/lib/validators";

export async function GET() {
  const cartId = await readCartId();
  if (!cartId) return json({ count: 0, lines: [], subtotalInr: 0 });
  try {
    const lines = await getCartLines(cartId);
    return json({ count: cartCount(lines), lines, subtotalInr: cartSubtotal(lines) });
  } catch (error) {
    console.error(error);
    return json({ count: 0, lines: [], subtotalInr: 0 });
  }
}

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const parsed = cartAddSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Choose a size before adding it to the bag." }, 400);
  const session = await auth();
  const cartId = await ensureCart(session?.user?.id);
  const quantity = parsed.data.quantity ?? 1;
  const [variant] = await getDb().select().from(productVariants).where(eq(productVariants.id, parsed.data.variantId)).limit(1);
  if (!variant) return json({ error: "That size is no longer sold." }, 404);
  const [existing] = await getDb()
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variant.id)))
    .limit(1);
  const next = (existing?.quantity ?? 0) + quantity;
  const available = variant.stockQuantity - variant.reservedQuantity;
  if (next > available) return json({ error: `Only ${available} left in this size.` }, 409);
  if (next > 10) return json({ error: "Ten is the most we can hold in one bag." }, 400);
  if (existing) {
    await getDb().update(cartItems).set({ quantity: next }).where(eq(cartItems.id, existing.id));
  } else {
    await getDb().insert(cartItems).values({ cartId, variantId: variant.id, quantity: next });
  }
  const lines = await getCartLines(cartId);
  return json({ count: cartCount(lines), lines, subtotalInr: cartSubtotal(lines) });
}

export async function PATCH(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const parsed = cartSetSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Could not update that piece." }, 400);
  const cartId = await readCartId();
  if (!cartId) return json({ error: "Your bag is empty." }, 400);
  if (parsed.data.quantity === 0) {
    await getDb()
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, parsed.data.variantId)));
  } else {
    const [variant] = await getDb().select().from(productVariants).where(eq(productVariants.id, parsed.data.variantId)).limit(1);
    if (!variant) return json({ error: "That size is no longer sold." }, 404);
    const available = variant.stockQuantity - variant.reservedQuantity;
    if (parsed.data.quantity > available) return json({ error: `Only ${available} left in this size.` }, 409);
    await getDb()
      .update(cartItems)
      .set({ quantity: parsed.data.quantity })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, parsed.data.variantId)));
  }
  const lines = await getCartLines(cartId);
  return json({ count: cartCount(lines), lines, subtotalInr: cartSubtotal(lines) });
}

export async function DELETE(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const cartId = await readCartId();
  const variantId = new URL(req.url).searchParams.get("variantId");
  if (!cartId || !variantId) return json({ error: "Nothing to remove." }, 400);
  await getDb().delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)));
  const lines = await getCartLines(cartId);
  return json({ count: cartCount(lines), lines, subtotalInr: cartSubtotal(lines) });
}
