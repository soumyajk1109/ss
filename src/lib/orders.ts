import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { orderItems, orders, type OrderRow } from "@/lib/db/schema";
import type { Role } from "@/lib/types";

export async function getOrderBundle(orderNumber: string) {
  const [order] = await getDb().select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order) return null;
  const items = await getDb().select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}

export async function canReadOrder(order: OrderRow, token: string | undefined, role?: Role | null, userId?: string | null) {
  if (role === "ADMIN" || role === "FULFILLMENT") return true;
  if (userId && order.userId === userId) return true;
  return Boolean(token && token === order.accessToken);
}

export async function viewerCanRead(order: OrderRow, token?: string) {
  const session = await auth();
  return canReadOrder(order, token, session?.user?.role, session?.user?.id);
}

export async function ordersForUser(userId: string) {
  return getDb().select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export function publicOrder(order: OrderRow, items: { productTitle: string; productSlug: string; sku: string; sizeValue: string; colorName: string; quantity: number; sellingPriceInr: number; lineTotalInr: number; hsnCode: string; gstRate: number }[]) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    phone: order.phone,
    email: order.email,
    shippingAddress: order.shippingAddress,
    placeOfSupply: order.placeOfSupply,
    subtotalInr: order.subtotalInr,
    discountInr: order.discountInr,
    shippingInr: order.shippingInr,
    codFeeInr: order.codFeeInr,
    taxableInr: order.taxableInr,
    cgstInr: order.cgstInr,
    sgstInr: order.sgstInr,
    igstInr: order.igstInr,
    totalInr: order.totalInr,
    reservationExpiresAt: order.reservationExpiresAt.toISOString(),
    confirmedAt: order.confirmedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    invoiceNumber: order.invoiceNumber,
    items,
  };
}
