import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTracker } from "@/components/orders/OrderTracker";
import { paymentsMode } from "@/lib/payments-mode";
import { getOrderBundle, viewerCanRead } from "@/lib/orders";
import { oneParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Order", referrer: "no-referrer" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderNumber } = await params;
  const token = oneParam((await searchParams).t);
  const bundle = await getOrderBundle(orderNumber).catch(() => null);
  if (!bundle || !(await viewerCanRead(bundle.order, token))) notFound();
  const { order, items } = bundle;
  return (
    <OrderTracker
      demo={paymentsMode() === "demo"}
      order={{
        orderNumber: order.orderNumber,
        accessToken: order.accessToken,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalInr: order.totalInr,
        subtotalInr: order.subtotalInr,
        shippingInr: order.shippingInr,
        codFeeInr: order.codFeeInr,
        cgstInr: order.cgstInr,
        sgstInr: order.sgstInr,
        igstInr: order.igstInr,
        reservationExpiresAt: order.reservationExpiresAt.toISOString(),
        createdAt: order.createdAt.toISOString(),
        placeOfSupply: order.placeOfSupply,
        shippingAddress: order.shippingAddress,
        items: items.map((item) => ({
          productTitle: item.productTitle,
          sku: item.sku,
          sizeValue: item.sizeValue,
          colorName: item.colorName,
          quantity: item.quantity,
          lineTotalInr: item.lineTotalInr,
        })),
      }}
    />
  );
}
