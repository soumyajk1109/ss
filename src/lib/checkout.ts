import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { brand } from "@/lib/brand";
import { getDb } from "@/lib/db";
import { cartItems, inventoryLogs, orderItems, orders, pincodeServiceability, productVariants, products } from "@/lib/db/schema";
import { releaseExpiredReservations, releaseReservation, type DbTx } from "@/lib/inventory";
import { issueOtp } from "@/lib/otp";
import { paymentsMode } from "@/lib/payments-mode";
import { priceOrder } from "@/lib/pricing";
import { createRazorpayOrder } from "@/lib/razorpay";
import type { Address, PaymentMethod } from "@/lib/types";
import { normalizeDestination } from "@/lib/utils";

export class CheckoutError extends Error {
  constructor(
    public code: "PINCODE" | "VALIDATION" | "CART_EMPTY" | "INSUFFICIENT_STOCK" | "NOT_FOUND" | "PAYMENT" | "ORDER_STATE",
    message: string,
  ) {
    super(message);
  }
}

export function newOrderNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `SS${y}${m}${d}${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function findPincode(pincode: string) {
  const [row] = await getDb()
    .select()
    .from(pincodeServiceability)
    .where(eq(pincodeServiceability.pincode, pincode))
    .limit(1);
  return row ?? null;
}

type LockedLine = {
  variant: typeof productVariants.$inferSelect;
  product: typeof products.$inferSelect;
  quantity: number;
};

export async function placeOrder(input: {
  cartId: string;
  userId: string | null;
  email: string | null;
  method: PaymentMethod;
  address: Address;
}) {
  await releaseExpiredReservations();
  const pin = await findPincode(input.address.pincode);
  if (!pin) {
    throw new CheckoutError(
      "PINCODE",
      "SS currently delivers to Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, and Pune.",
    );
  }
  if (input.method === "COD" && !pin.codAvailable) {
    throw new CheckoutError("PINCODE", "Cash on delivery is not available for this pincode.");
  }
  const phone = normalizeDestination(input.address.phone);
  if (!phone || phone.channel !== "phone") {
    throw new CheckoutError("VALIDATION", "Enter an Indian mobile number for delivery updates.");
  }

  const cartLines = await getDb()
    .select({ variantId: cartItems.variantId, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.cartId, input.cartId));
  if (!cartLines.length) throw new CheckoutError("CART_EMPTY", "Your bag is empty.");

  const address: Address = {
    ...input.address,
    phone: phone.destination,
    state: pin.state,
    line2: input.address.line2 || undefined,
  };

  const created = await getDb().transaction(async (tx) => {
    const ids = [...new Set(cartLines.map((line) => line.variantId))].sort();
    const locked: LockedLine[] = [];

    for (const id of ids) {
      const [variant] = await tx.select().from(productVariants).where(eq(productVariants.id, id)).for("update");
      if (!variant) throw new CheckoutError("NOT_FOUND", "A size in your bag is no longer sold.");
      const quantity = cartLines.filter((line) => line.variantId === id).reduce((sum, line) => sum + line.quantity, 0);
      const [product] = await tx.select().from(products).where(eq(products.id, variant.productId)).limit(1);
      if (!product?.isPublished) throw new CheckoutError("NOT_FOUND", "A piece in your bag is unavailable.");
      const available = variant.stockQuantity - variant.reservedQuantity;
      if (available < quantity) {
        throw new CheckoutError(
          "INSUFFICIENT_STOCK",
          `${product.title} in ${variant.sizeValue} / ${variant.colorName} has ${available} left.`,
        );
      }
      locked.push({ variant, product, quantity });
    }

    const subtotal = locked.reduce((sum, line) => sum + line.variant.sellingPriceInr * line.quantity, 0);
    const priced = priceOrder({
      placeOfSupply: pin.state,
      shippingInr: subtotal >= brand.freeShippingOverInr ? 0 : pin.shippingInr,
      codFeeInr: input.method === "COD" ? brand.codFeeInr : 0,
      items: locked.map((line) => ({
        key: line.variant.id,
        title: line.product.title,
        sku: line.variant.sku,
        hsnCode: line.product.hsnCode,
        gstRate: line.product.gstRate,
        quantity: line.quantity,
        unitInr: line.variant.sellingPriceInr,
        mrpInr: line.variant.mrpInr,
      })),
    });

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: newOrderNumber(),
        accessToken: randomBytes(24).toString("hex"),
        userId: input.userId,
        status: input.method === "COD" ? "COD_PENDING" : "RESERVED",
        paymentMethod: input.method,
        paymentStatus: input.method === "COD" ? "COD_PENDING" : "PENDING",
        email: input.email,
        phone: phone.destination,
        shippingAddress: address,
        pincode: pin.pincode,
        placeOfSupply: pin.state,
        subtotalInr: priced.subtotalInr,
        discountInr: priced.discountInr,
        shippingInr: priced.shippingInr,
        codFeeInr: priced.codFeeInr,
        taxableInr: priced.taxableInr,
        cgstInr: priced.cgstInr,
        sgstInr: priced.sgstInr,
        igstInr: priced.igstInr,
        totalInr: priced.totalInr,
        reservationExpiresAt: new Date(Date.now() + brand.reservationMinutes * 60 * 1000),
      })
      .returning();
    if (!order) throw new CheckoutError("PAYMENT", "Could not open the order.");

    await tx.insert(orderItems).values(
      locked.map((line) => ({
        orderId: order.id,
        variantId: line.variant.id,
        productTitle: line.product.title,
        productSlug: line.product.slug,
        sku: line.variant.sku,
        hsnCode: line.product.hsnCode,
        gstRate: line.product.gstRate,
        sizeType: line.variant.sizeType,
        sizeValue: line.variant.sizeValue,
        colorName: line.variant.colorName,
        quantity: line.quantity,
        mrpInr: line.variant.mrpInr,
        sellingPriceInr: line.variant.sellingPriceInr,
        lineTotalInr: line.variant.sellingPriceInr * line.quantity,
      })),
    );

    await applyReservation(tx, order.id, locked);
    await tx.delete(cartItems).where(eq(cartItems.cartId, input.cartId));
    return order;
  });

  if (input.method === "COD") {
    try {
      const otp = await issueOtp({ destination: phone.destination, purpose: "COD", orderId: created.id });
      return { kind: "cod" as const, order: created, devCode: otp.devCode };
    } catch (error) {
      return {
        kind: "cod" as const,
        order: created,
        devCode: undefined,
        otpError: error instanceof Error ? error.message : "Could not send the code.",
      };
    }
  }

  if (paymentsMode() === "demo") return { kind: "demo" as const, order: created };

  try {
    const razorpay = await createRazorpayOrder({
      amountInr: created.totalInr,
      receipt: created.orderNumber,
      orderId: created.id,
      orderNumber: created.orderNumber,
    });
    await getDb()
      .update(orders)
      .set({ razorpayOrderId: razorpay.id, updatedAt: new Date() })
      .where(eq(orders.id, created.id));
    return { kind: "razorpay" as const, order: { ...created, razorpayOrderId: razorpay.id }, keyId: razorpay.keyId };
  } catch (error) {
    console.error("razorpay_order_failed", created.orderNumber, error);
    await getDb().transaction(async (tx) => {
      await releaseReservation(tx, created.id, "CANCELLED");
    });
    throw new CheckoutError("PAYMENT", "Razorpay did not open the order. The size hold was released.");
  }
}

async function applyReservation(tx: DbTx, orderId: string, locked: LockedLine[]) {
  for (const line of locked) {
    const reservedAfter = line.variant.reservedQuantity + line.quantity;
    await tx
      .update(productVariants)
      .set({ reservedQuantity: reservedAfter })
      .where(eq(productVariants.id, line.variant.id));
    await tx.insert(inventoryLogs).values({
      variantId: line.variant.id,
      orderId,
      action: "RESERVED",
      quantity: line.quantity,
      stockAfter: line.variant.stockQuantity,
      reservedAfter,
      note: "checkout_hold",
    });
  }
}

export async function loadAccessibleOrder(orderNumber: string, accessToken: string) {
  const [order] = await getDb().select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order || order.accessToken !== accessToken) return null;
  return order;
}
