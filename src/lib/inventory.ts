import { and, asc, eq, inArray, lt } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { getDb } from "@/lib/db";
import {
  inventoryLogs,
  orderItems,
  orders,
  productVariants,
  type OrderRow,
} from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";
import { financialYear } from "@/lib/gst";
import type { OrderStatus } from "@/lib/types";

export type DbTx = PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

export class StockError extends Error {
  constructor(
    public code: "INSUFFICIENT_STOCK" | "ORDER_STATE" | "NOT_FOUND" | "CONFLICT",
    message: string,
  ) {
    super(message);
  }
}

const FINAL_PAID: OrderStatus[] = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "RETURNED"];

export async function releaseReservation(tx: DbTx, orderId: string, nextStatus: "EXPIRED" | "CANCELLED") {
  const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
  if (!order) return false;
  if (order.status !== "RESERVED" && order.status !== "COD_PENDING") return false;

  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const sorted = items
    .filter((item) => item.variantId)
    .sort((a, b) => a.variantId!.localeCompare(b.variantId!));

  for (const item of sorted) {
    const [variant] = await tx
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, item.variantId!))
      .for("update");
    if (!variant) throw new StockError("NOT_FOUND", `Variant missing while releasing ${order.orderNumber}.`);
    const releaseQty = Math.min(variant.reservedQuantity, item.quantity);
    const reservedAfter = variant.reservedQuantity - releaseQty;
    await tx
      .update(productVariants)
      .set({ reservedQuantity: reservedAfter })
      .where(eq(productVariants.id, variant.id));
    if (releaseQty > 0) {
      await tx.insert(inventoryLogs).values({
        variantId: variant.id,
        orderId: order.id,
        action: "RELEASED",
        quantity: releaseQty,
        stockAfter: variant.stockQuantity,
        reservedAfter,
        note: nextStatus === "EXPIRED" ? "hold_expired" : "hold_cancelled",
      });
    }
  }

  await tx
    .update(orders)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
      internalNote: nextStatus === "EXPIRED" ? "reservation_expired" : order.internalNote,
    })
    .where(eq(orders.id, order.id));
  return true;
}

async function restockSoldItems(tx: DbTx, order: OrderRow, note: string) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const sorted = items
    .filter((item) => item.variantId)
    .sort((a, b) => a.variantId!.localeCompare(b.variantId!));
  if (sorted.length !== items.length) {
    throw new StockError("NOT_FOUND", "A sold SKU was removed, so this order cannot be restocked automatically.");
  }
  for (const item of sorted) {
    const [variant] = await tx
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, item.variantId!))
      .for("update");
    if (!variant) throw new StockError("NOT_FOUND", `Variant missing while restocking ${item.sku}.`);
    const stockAfter = variant.stockQuantity + item.quantity;
    await tx.update(productVariants).set({ stockQuantity: stockAfter }).where(eq(productVariants.id, variant.id));
    await tx.insert(inventoryLogs).values({
      variantId: variant.id,
      orderId: order.id,
      action: "RETURNED",
      quantity: item.quantity,
      stockAfter,
      reservedAfter: variant.reservedQuantity,
      note,
    });
  }
}

export async function confirmPaidOrder(
  orderId: string,
  payment: { method: "RAZORPAY" | "COD"; razorpayPaymentId?: string; expectedAmountPaise?: number },
) {
  return getDb().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new StockError("NOT_FOUND", "Order not found.");

    if (FINAL_PAID.includes(order.status)) {
      if (payment.razorpayPaymentId && order.razorpayPaymentId && order.razorpayPaymentId !== payment.razorpayPaymentId) {
        await tx
          .update(orders)
          .set({
            internalNote: `duplicate_payment:${payment.razorpayPaymentId}`,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      }
      return { result: "already_confirmed" as const, order };
    }

    if (order.status === "EXPIRED" || order.status === "CANCELLED") {
      await tx
        .update(orders)
        .set({
          paymentStatus: payment.method === "COD" ? order.paymentStatus : "CAPTURED",
          razorpayPaymentId: payment.razorpayPaymentId ?? order.razorpayPaymentId,
          internalNote: "late_payment_needs_refund",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
      return { result: "needs_refund" as const, order };
    }

    if (order.status !== "RESERVED" && order.status !== "COD_PENDING") {
      throw new StockError("ORDER_STATE", `Order is ${order.status}.`);
    }
    if (payment.method === "COD" && order.status !== "COD_PENDING") {
      throw new StockError("ORDER_STATE", "This order is not waiting for a COD code.");
    }
    if (payment.method === "RAZORPAY" && order.status !== "RESERVED") {
      throw new StockError("ORDER_STATE", "This order is not waiting for payment.");
    }
    if (payment.expectedAmountPaise != null && payment.expectedAmountPaise !== order.totalInr * 100) {
      await tx
        .update(orders)
        .set({
          paymentStatus: "FAILED",
          internalNote: `amount_mismatch:${payment.expectedAmountPaise}`,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
      return { result: "amount_mismatch" as const, order };
    }

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const sorted = [...items].sort((a, b) => (a.variantId ?? "").localeCompare(b.variantId ?? ""));
    for (const item of sorted) {
      if (!item.variantId) throw new StockError("NOT_FOUND", `SKU ${item.sku} is no longer linked.`);
      const [variant] = await tx
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .for("update");
      if (!variant) throw new StockError("NOT_FOUND", `SKU ${item.sku} is missing.`);
      if (variant.reservedQuantity < item.quantity || variant.stockQuantity < item.quantity) {
        throw new StockError("CONFLICT", `${item.sku} is no longer covered by its checkout hold.`);
      }
      const stockAfter = variant.stockQuantity - item.quantity;
      const reservedAfter = variant.reservedQuantity - item.quantity;
      await tx
        .update(productVariants)
        .set({ stockQuantity: stockAfter, reservedQuantity: reservedAfter })
        .where(eq(productVariants.id, variant.id));
      await tx.insert(inventoryLogs).values({
        variantId: variant.id,
        orderId: order.id,
        action: "SOLD",
        quantity: item.quantity,
        stockAfter,
        reservedAfter,
        note: payment.method === "COD" ? "cod_verified" : "payment_captured",
      });
    }

    const [updated] = await tx
      .update(orders)
      .set({
        status: "CONFIRMED",
        paymentStatus: payment.method === "COD" ? "COD_VERIFIED" : "CAPTURED",
        razorpayPaymentId: payment.razorpayPaymentId ?? order.razorpayPaymentId,
        confirmedAt: new Date(),
        invoiceNumber: `SS/${financialYear()}/${order.orderNumber}`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning();
    return { result: "confirmed" as const, order: updated ?? order };
  });
}

export async function releaseExpiredReservations() {
  const due = await getDb()
    .select({ id: orders.id })
    .from(orders)
    .where(and(inArray(orders.status, ["RESERVED", "COD_PENDING"]), lt(orders.reservationExpiresAt, new Date())))
    .orderBy(asc(orders.reservationExpiresAt))
    .limit(50);

  let released = 0;
  for (const row of due) {
    try {
      const did = await getDb().transaction(async (tx) => releaseReservation(tx, row.id, "EXPIRED"));
      if (did) released += 1;
    } catch (error) {
      console.error("release_expired_failed", row.id, error);
    }
  }
  return released;
}

const TRANSITIONS: Record<string, OrderStatus[]> = {
  RESERVED: ["CANCELLED"],
  COD_PENDING: ["CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
};

export async function transitionOrder(orderId: string, next: OrderStatus, actorId: string) {
  return getDb().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new StockError("NOT_FOUND", "Order not found.");
    if (!TRANSITIONS[order.status]?.includes(next)) {
      throw new StockError("ORDER_STATE", `Cannot move ${order.status} to ${next}.`);
    }
    if ((order.status === "RESERVED" || order.status === "COD_PENDING") && next === "CANCELLED") {
      await releaseReservation(tx, order.id, "CANCELLED");
      return;
    }
    if (next === "CANCELLED" || next === "RETURNED") {
      await restockSoldItems(
        tx,
        order,
        next === "CANCELLED" ? `cancel_before_ship by:${actorId}` : `customer_return by:${actorId}`,
      );
    }
    await tx
      .update(orders)
      .set({ status: next, updatedAt: new Date() })
      .where(eq(orders.id, order.id));
  });
}

export async function adjustStock(input: {
  sku: string;
  quantity: number;
  mode: "add" | "set";
  note?: string;
  actorId: string;
}) {
  return getDb().transaction(async (tx) => {
    const [variant] = await tx
      .select()
      .from(productVariants)
      .where(eq(productVariants.sku, input.sku))
      .for("update");
    if (!variant) throw new StockError("NOT_FOUND", `SKU ${input.sku} was not found.`);
    const next = input.mode === "add" ? variant.stockQuantity + input.quantity : input.quantity;
    if (next < variant.reservedQuantity) {
      throw new StockError(
        "CONFLICT",
        `${input.sku} has ${variant.reservedQuantity} pieces on hold. Stock cannot drop below that.`,
      );
    }
    if (next < 0) throw new StockError("CONFLICT", "Stock cannot be negative.");
    const delta = next - variant.stockQuantity;
    await tx.update(productVariants).set({ stockQuantity: next }).where(eq(productVariants.id, variant.id));
    if (delta > 0) {
      await tx.insert(inventoryLogs).values({
        variantId: variant.id,
        action: "STOCK_IN",
        quantity: delta,
        stockAfter: next,
        reservedAfter: variant.reservedQuantity,
        note: input.note?.trim() || `stock_in by:${input.actorId}`,
      });
    } else if (delta < 0) {
      await tx.insert(inventoryLogs).values({
        variantId: variant.id,
        action: "ADJUSTMENT",
        quantity: Math.abs(delta),
        stockAfter: next,
        reservedAfter: variant.reservedQuantity,
        note: input.note?.trim() || `recount_down by:${input.actorId}`,
      });
    }
    return { sku: variant.sku, stockQuantity: next, reservedQuantity: variant.reservedQuantity };
  });
}
