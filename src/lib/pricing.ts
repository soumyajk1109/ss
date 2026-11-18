import { brand } from "@/lib/brand";
import { allocateTax, isIntraState, splitInclusiveGst } from "@/lib/gst";

export const SHIPPING_GST_PERCENT = 18;

export type PriceInputItem = {
  key: string;
  title: string;
  sku: string;
  hsnCode: string;
  gstRate: number;
  quantity: number;
  unitInr: number;
  mrpInr: number;
};

export type PricedLine = PriceInputItem & {
  lineTotalInr: number;
  taxableInr: number;
  gstInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
};

export type PricedOrder = {
  intraState: boolean;
  items: PricedLine[];
  shipping: PricedLine | null;
  cod: PricedLine | null;
  subtotalInr: number;
  discountInr: number;
  shippingInr: number;
  codFeeInr: number;
  taxableInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalInr: number;
};

function priceInclusiveLine(
  item: PriceInputItem,
  gstRate: number,
  intraState: boolean,
): PricedLine {
  const lineTotalInr = item.unitInr * item.quantity;
  const split = splitInclusiveGst(lineTotalInr, gstRate);
  const tax = allocateTax(split.gstInr, intraState);
  return {
    ...item,
    gstRate,
    lineTotalInr,
    taxableInr: split.taxableInr,
    gstInr: split.gstInr,
    ...tax,
  };
}

export function priceOrder(input: {
  items: PriceInputItem[];
  shippingInr: number;
  codFeeInr: number;
  placeOfSupply: string;
  sellerState?: string;
}): PricedOrder {
  const intraState = isIntraState(input.placeOfSupply, input.sellerState ?? brand.state);
  const items = input.items.map((item) => priceInclusiveLine(item, item.gstRate, intraState));
  const shipping =
    input.shippingInr > 0
      ? priceInclusiveLine(
          {
            key: "shipping",
            title: "Delivery",
            sku: "SHIP",
            hsnCode: "996812",
            gstRate: SHIPPING_GST_PERCENT,
            quantity: 1,
            unitInr: input.shippingInr,
            mrpInr: input.shippingInr,
          },
          SHIPPING_GST_PERCENT,
          intraState,
        )
      : null;
  const cod =
    input.codFeeInr > 0
      ? priceInclusiveLine(
          {
            key: "cod",
            title: "Cash on delivery fee",
            sku: "COD",
            hsnCode: "996812",
            gstRate: SHIPPING_GST_PERCENT,
            quantity: 1,
            unitInr: input.codFeeInr,
            mrpInr: input.codFeeInr,
          },
          SHIPPING_GST_PERCENT,
          intraState,
        )
      : null;

  const lines = [...items, ...(shipping ? [shipping] : []), ...(cod ? [cod] : [])];
  const sum = (pick: (line: PricedLine) => number) => lines.reduce((total, line) => total + pick(line), 0);
  const subtotalInr = input.items.reduce((total, item) => total + item.unitInr * item.quantity, 0);
  const discountInr = input.items.reduce(
    (total, item) => total + Math.max(0, item.mrpInr - item.unitInr) * item.quantity,
    0,
  );

  return {
    intraState,
    items,
    shipping,
    cod,
    subtotalInr,
    discountInr,
    shippingInr: input.shippingInr,
    codFeeInr: input.codFeeInr,
    taxableInr: sum((line) => line.taxableInr),
    cgstInr: sum((line) => line.cgstInr),
    sgstInr: sum((line) => line.sgstInr),
    igstInr: sum((line) => line.igstInr),
    totalInr: subtotalInr + input.shippingInr + input.codFeeInr,
  };
}
