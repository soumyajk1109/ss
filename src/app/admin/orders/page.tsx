import type { Metadata } from "next";
import { listOrders } from "@/lib/admin";
import { OrderBoard } from "@/components/admin/OrderBoard";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersAdminPage() {
  const rows = await listOrders();
  return (
    <div>
      <p className="eyebrow">Fulfilment</p>
      <h1 className="mt-2 font-display text-5xl">Orders</h1>
      <div className="mt-6">
        <OrderBoard
          rows={rows.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            totalInr: order.totalInr,
            city: order.shippingAddress.city,
            placeOfSupply: order.placeOfSupply,
            pieces: order.pieces,
            createdAt: order.createdAt.toISOString(),
            invoiceReady: Boolean(order.invoiceNumber),
          }))}
        />
      </div>
    </div>
  );
}
