import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { brand } from "@/lib/brand";
import { auth } from "@/lib/auth";
import { cartSubtotal, getCartLines, readCartId } from "@/lib/cart";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const cartId = await readCartId();
  const lines = cartId ? await getCartLines(cartId).catch(() => []) : [];
  if (!lines.length) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-display text-5xl">The bag is empty.</h1>
        <Link href="/shop" className="btn-botanical mt-6">Shop the edit</Link>
      </div>
    );
  }
  const session = await auth().catch(() => null);
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <CheckoutForm
        lines={lines}
        subtotal={cartSubtotal(lines)}
        email={session?.user?.email}
        freeShippingOverInr={brand.freeShippingOverInr}
        codFeeInr={brand.codFeeInr}
      />
    </div>
  );
}
