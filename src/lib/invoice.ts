import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { eq } from "drizzle-orm";
import { brand } from "@/lib/brand";
import { getDb } from "@/lib/db";
import { orderItems, orders, type OrderItemRow, type OrderRow } from "@/lib/db/schema";
import { inrInWords, stateCode } from "@/lib/gst";
import { priceOrder } from "@/lib/pricing";
import { formatInr, formatWhen } from "@/lib/utils";

export async function getInvoiceSource(orderId: string) {
  const [order] = await getDb().select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;
  const items = await getDb().select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}

export function buildInvoice(order: OrderRow, items: OrderItemRow[]) {
  const priced = priceOrder({
    placeOfSupply: order.placeOfSupply,
    shippingInr: order.shippingInr,
    codFeeInr: order.codFeeInr,
    items: items.map((item) => ({
      key: item.id,
      title: `${item.productTitle} · ${item.colorName} / ${item.sizeValue}`,
      sku: item.sku,
      hsnCode: item.hsnCode,
      gstRate: item.gstRate,
      quantity: item.quantity,
      unitInr: item.sellingPriceInr,
      mrpInr: item.mrpInr,
    })),
  });
  return {
    order,
    priced,
    amountInWords: inrInWords(order.totalInr),
    buyerStateCode: stateCode(order.placeOfSupply),
    invoiceNumber: order.invoiceNumber ?? `SS/${order.orderNumber}`,
    invoiceDate: formatWhen(order.confirmedAt ?? order.createdAt),
  };
}

export async function renderInvoicePdf(order: OrderRow, items: OrderItemRow[]) {
  const invoice = buildInvoice(order, items);
  const pdf = await PDFDocument.create();
  const pageSize: [number, number] = [595.28, 841.89];
  let page = pdf.addPage(pageSize);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.1, 0.1);
  const green = rgb(0.106, 0.302, 0.243);
  let y = 800;

  const write = (text: string, x: number, size = 10, face = font, color = ink) => {
    page.drawText(sanitize(text), { x, y, size, font: face, color });
  };
  const rule = () => {
    page.drawLine({ start: { x: 40, y: y - 4 }, end: { x: 555, y: y - 4 }, thickness: 0.6, color: green });
  };

  write("TAX INVOICE", 40, 18, bold, green);
  write(brand.name, 470, 18, bold, green);
  y -= 28;
  write(brand.legalName, 40, 11, bold);
  y -= 16;
  for (const line of brand.addressLines) {
    write(line, 40, 9);
    y -= 12;
  }
  write(`GSTIN ${brand.gstin}  ·  ${brand.state} (${brand.stateCode})`, 40, 9);
  y -= 14;
  write(`Invoice ${invoice.invoiceNumber}`, 40, 10, bold);
  write(`Order ${order.orderNumber}`, 320, 10);
  y -= 14;
  write(`Date ${invoice.invoiceDate} IST`, 40, 9);
  write(order.paymentMethod === "COD" ? "Cash on delivery" : "Razorpay", 320, 9);
  y -= 18;
  rule();
  y -= 20;
  write("Bill to", 40, 10, bold);
  y -= 14;
  const address = order.shippingAddress;
  for (const line of [address.name, address.line1, address.line2, `${address.city} ${address.pincode}`, address.phone, order.email].filter(Boolean)) {
    write(String(line), 40, 9);
    y -= 12;
  }
  y -= 6;
  write(`Place of supply: ${order.placeOfSupply}${invoice.buyerStateCode ? ` (${invoice.buyerStateCode})` : ""}`, 40, 9, bold);
  write(invoice.priced.intraState ? "CGST + SGST" : "IGST", 320, 9);
  y -= 18;
  rule();
  y -= 16;
  write("Description", 40, 8, bold);
  write("HSN", 280, 8, bold);
  write("Qty", 340, 8, bold);
  write("Taxable", 390, 8, bold);
  write("GST", 460, 8, bold);
  write("Total", 510, 8, bold);
  y -= 8;
  rule();
  y -= 16;

  const lines = [
    ...invoice.priced.items,
    ...(invoice.priced.shipping ? [invoice.priced.shipping] : []),
    ...(invoice.priced.cod ? [invoice.priced.cod] : []),
  ];
  for (const line of lines) {
    if (y < 120) {
      page = pdf.addPage(pageSize);
      y = 800;
    }
    write(trim(line.title, 42), 40, 8);
    write(line.hsnCode, 280, 8);
    write(String(line.quantity), 340, 8);
    write(String(line.taxableInr), 390, 8);
    write(`${line.gstInr} (${line.gstRate}%)`, 450, 8);
    write(String(line.lineTotalInr), 510, 8);
    y -= 14;
  }

  y -= 8;
  rule();
  y -= 18;
  write(`Taxable ${formatPlain(invoice.priced.taxableInr)}`, 340, 9);
  y -= 14;
  if (invoice.priced.intraState) {
    write(`CGST ${formatPlain(order.cgstInr)}`, 340, 9);
    y -= 14;
    write(`SGST ${formatPlain(order.sgstInr)}`, 340, 9);
  } else {
    write(`IGST ${formatPlain(order.igstInr)}`, 340, 9);
  }
  y -= 16;
  write(`Total ${formatPlain(order.totalInr)}`, 340, 12, bold, green);
  y -= 28;
  write(invoice.amountInWords, 40, 9);
  y -= 28;
  write("Prices are GST-inclusive. HSN/SAC codes are catalogue defaults — confirm them with your tax advisor.", 40, 8);
  y -= 12;
  if (brand.sellerIsSample) {
    write("SAMPLE INVOICE. Set SELLER_GSTIN before issuing this to a customer.", 40, 8, bold);
    y -= 12;
  }
  write("This is a computer-generated invoice.", 40, 8);

  return Buffer.from(await pdf.save());
}

function sanitize(value: string) {
  return value.replace(/[^\x20-\x7E]/g, " ");
}

function trim(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…`.replace("…", ".") : value;
}

function formatPlain(value: number) {
  return `INR ${formatInr(value).replace("₹", "").trim()}`;
}
