import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/lib/brand";
import { buildInvoice, getInvoiceSource } from "@/lib/invoice";
import { formatInr } from "@/lib/utils";

export const metadata: Metadata = { title: "Tax invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const source = await getInvoiceSource(orderId);
  if (!source?.order.invoiceNumber) notFound();
  const invoice = buildInvoice(source.order, source.items);
  const lines = [...invoice.priced.items, ...(invoice.priced.shipping ? [invoice.priced.shipping] : []), ...(invoice.priced.cod ? [invoice.priced.cod] : [])];
  const address = source.order.shippingAddress;
  return (
    <article className="bg-white p-4 md:p-8">
      <div className="no-print mb-6 flex gap-3">
        <a className="btn-botanical" href={`/api/admin/invoices/${source.order.id}`}>Download PDF</a>
        <Link href="/admin/orders" className="btn-line">Back</Link>
      </div>
      <header className="flex items-start justify-between gap-6 border-b-2 border-botanical pb-4">
        <div>
          <p className="font-display text-4xl text-botanical">Tax invoice</p>
          <p className="mt-2 text-sm">{brand.legalName}</p>
          {brand.addressLines.map((line) => <p key={line} className="text-sm text-clay">{line}</p>)}
          <p className="mt-2 text-sm">GSTIN {brand.gstin} · {brand.state} ({brand.stateCode})</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">{invoice.invoiceNumber}</p>
          <p>{invoice.invoiceDate}</p>
          <p>Order {source.order.orderNumber}</p>
          <p>{source.order.paymentMethod === "COD" ? "Cash on delivery" : "Razorpay"}</p>
        </div>
      </header>
      {brand.sellerIsSample ? <p className="mt-4 bg-turmeric/40 px-3 py-2 text-sm">Sample invoice. Set SELLER_GSTIN before issuing this to a customer.</p> : null}
      <section className="mt-6 text-sm">
        <p className="eyebrow">Bill to</p>
        <p className="mt-2">{address.name}</p>
        <p>{address.line1}</p>
        {address.line2 ? <p>{address.line2}</p> : null}
        <p>{address.city} {address.pincode}</p>
        <p>{address.phone}</p>
        <p className="mt-2">Place of supply: {source.order.placeOfSupply}{invoice.buyerStateCode ? ` (${invoice.buyerStateCode})` : ""} · {invoice.priced.intraState ? "CGST + SGST" : "IGST"}</p>
      </section>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-[0.14em] text-clay">
          <tr>
            <th className="py-2">Description</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Taxable</th>
            <th>GST</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.key} className="border-t border-line">
              <td className="py-2">{line.title}<span className="block text-xs text-clay">{line.sku}</span></td>
              <td>{line.hsnCode}</td>
              <td>{line.quantity}</td>
              <td>{formatInr(line.taxableInr)}</td>
              <td>{formatInr(line.gstInr)} ({line.gstRate}%)</td>
              <td>{formatInr(line.lineTotalInr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-6 max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><dt>Taxable</dt><dd>{formatInr(source.order.taxableInr)}</dd></div>
        {source.order.cgstInr ? <div className="flex justify-between"><dt>CGST</dt><dd>{formatInr(source.order.cgstInr)}</dd></div> : null}
        {source.order.sgstInr ? <div className="flex justify-between"><dt>SGST</dt><dd>{formatInr(source.order.sgstInr)}</dd></div> : null}
        {source.order.igstInr ? <div className="flex justify-between"><dt>IGST</dt><dd>{formatInr(source.order.igstInr)}</dd></div> : null}
        <div className="flex justify-between border-t border-botanical pt-2 font-display text-2xl"><dt>Total</dt><dd>{formatInr(source.order.totalInr)}</dd></div>
      </dl>
      <p className="mt-6 text-sm">{invoice.amountInWords}</p>
      <p className="mt-4 text-xs leading-5 text-clay">Prices are GST-inclusive. HSN and SAC codes are catalogue defaults. Have a tax advisor confirm them before go-live. This is a computer-generated invoice.</p>
    </article>
  );
}
