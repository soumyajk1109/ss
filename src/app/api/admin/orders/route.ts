import { listOrders } from "@/lib/admin";
import { requireRole } from "@/lib/guards";
import { json } from "@/lib/http";

export async function GET() {
  const gate = await requireRole(["ADMIN", "FULFILLMENT"]);
  if (gate.response) return gate.response;
  const rows = await listOrders();
  return json({
    orders: rows.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalInr: order.totalInr,
      city: order.shippingAddress.city,
      placeOfSupply: order.placeOfSupply,
      pieces: order.pieces,
      createdAt: order.createdAt,
      reservationExpiresAt: order.reservationExpiresAt,
    })),
  });
}
