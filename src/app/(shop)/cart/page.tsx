import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { cartSubtotal, getCartLines, readCartId } from "@/lib/cart";

export const metadata: Metadata = { title: "Bag" };

export default async function CartPage() {
  const cartId = await readCartId();
  const lines = cartId ? await getCartLines(cartId).catch(() => []) : [];
  return <CartView lines={lines} subtotal={cartSubtotal(lines)} />;
}
