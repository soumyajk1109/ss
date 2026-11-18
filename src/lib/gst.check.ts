import assert from "node:assert/strict";
import { allocateTax, inrInWords, isIntraState, splitInclusiveGst } from "./gst";
import { priceOrder } from "./pricing";

assert.deepEqual(splitInclusiveGst(1050, 5), { taxableInr: 1000, gstInr: 50 });
assert.deepEqual(splitInclusiveGst(1180, 18), { taxableInr: 1000, gstInr: 180 });
assert.deepEqual(allocateTax(51, true), { cgstInr: 25, sgstInr: 26, igstInr: 0 });
assert.deepEqual(allocateTax(51, false), { cgstInr: 0, sgstInr: 0, igstInr: 51 });
assert.equal(isIntraState("Maharashtra"), true);
assert.equal(isIntraState("Karnataka"), false);
assert.equal(inrInWords(2490), "Two thousand four hundred ninety rupees only");

const intra = priceOrder({
  placeOfSupply: "Maharashtra",
  shippingInr: 49,
  codFeeInr: 0,
  items: [
    {
      key: "a",
      title: "Kurta",
      sku: "SS-A",
      hsnCode: "6203",
      gstRate: 12,
      quantity: 1,
      unitInr: 2490,
      mrpInr: 3290,
    },
  ],
});

assert.equal(intra.intraState, true);
assert.equal(intra.totalInr, 2539);
assert.equal(intra.cgstInr + intra.sgstInr, intra.items[0]!.gstInr + intra.shipping!.gstInr);
assert.equal(intra.igstInr, 0);
assert.equal(intra.taxableInr + intra.cgstInr + intra.sgstInr + intra.igstInr, intra.totalInr);

const inter = priceOrder({
  placeOfSupply: "Delhi",
  shippingInr: 0,
  codFeeInr: 40,
  items: [
    {
      key: "b",
      title: "Tee",
      sku: "SS-B",
      hsnCode: "6109",
      gstRate: 5,
      quantity: 2,
      unitInr: 899,
      mrpInr: 1290,
    },
  ],
});

assert.equal(inter.intraState, false);
assert.equal(inter.totalInr, 1838);
assert.equal(inter.igstInr, inter.items[0]!.gstInr + inter.cod!.gstInr);
assert.equal(inter.cgstInr, 0);
assert.equal(inter.discountInr, (1290 - 899) * 2);

console.log("gst checks passed");
