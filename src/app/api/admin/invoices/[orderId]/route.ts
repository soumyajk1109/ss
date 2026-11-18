import { requireRole } from "@/lib/guards";
import { getInvoiceSource, renderInvoicePdf } from "@/lib/invoice";
import { json } from "@/lib/http";

export async function GET(_req: Request, context: { params: Promise<{ orderId: string }> }) {
  const gate = await requireRole(["ADMIN", "FULFILLMENT"]);
  if (gate.response) return gate.response;
  const { orderId } = await context.params;
  const source = await getInvoiceSource(orderId);
  if (!source) return json({ error: "Order not found." }, 404);
  if (!source.order.invoiceNumber) return json({ error: "This order has no tax invoice yet." }, 409);
  const pdf = await renderInvoicePdf(source.order, source.items);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${source.order.invoiceNumber.replaceAll("/", "-")}.pdf"`,
    },
  });
}
