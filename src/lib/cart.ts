import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { cartItems, carts, productVariants, products } from "@/lib/db/schema";
import type { CartLine } from "@/lib/types";

export const CART_COOKIE = "ss_cart";

export async function readCartId() {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value ?? null;
}

export async function getCartLines(cartId: string): Promise<CartLine[]> {
  const rows = await getDb()
    .select({
      quantity: cartItems.quantity,
      variant: productVariants,
      title: products.title,
      slug: products.slug,
      published: products.isPublished,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(cartItems.cartId, cartId));

  return rows.map((row) => ({
    variantId: row.variant.id,
    sku: row.variant.sku,
    title: row.title,
    slug: row.slug,
    sizeType: row.variant.sizeType,
    sizeValue: row.variant.sizeValue,
    colorName: row.variant.colorName,
    colorHex: row.variant.colorHex,
    quantity: row.quantity,
    available: row.variant.stockQuantity - row.variant.reservedQuantity,
    mrpInr: row.variant.mrpInr,
    sellingPriceInr: row.variant.sellingPriceInr,
    lineTotalInr: row.variant.sellingPriceInr * row.quantity,
    published: row.published,
  }));
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.lineTotalInr, 0);
}

export async function ensureCart(userId?: string | null) {
  const existing = await readCartId();
  if (existing) {
    const [cart] = await getDb().select({ id: carts.id }).from(carts).where(eq(carts.id, existing)).limit(1);
    if (cart) {
      if (userId) {
        await getDb().update(carts).set({ userId, updatedAt: new Date() }).where(eq(carts.id, cart.id));
      }
      return cart.id;
    }
  }
  const [created] = await getDb()
    .insert(carts)
    .values({ userId: userId ?? null })
    .returning({ id: carts.id });
  if (!created) throw new Error("Could not start a bag.");
  const jar = await cookies();
  jar.set(CART_COOKIE, created.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return created.id;
}
