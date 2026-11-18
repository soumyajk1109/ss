import { brand } from "@/lib/brand";

/** GST state codes. Place of supply is matched on this, then on the state name. */
export const INDIA_STATE_CODES: Record<string, string> = {
  "andaman and nicobar islands": "35",
  "andhra pradesh": "37",
  "arunachal pradesh": "12",
  assam: "18",
  bihar: "10",
  chandigarh: "04",
  chhattisgarh: "22",
  "dadra and nagar haveli and daman and diu": "26",
  delhi: "07",
  goa: "30",
  gujarat: "24",
  haryana: "06",
  "himachal pradesh": "02",
  "jammu and kashmir": "01",
  jharkhand: "20",
  karnataka: "29",
  kerala: "32",
  ladakh: "38",
  lakshadweep: "31",
  "madhya pradesh": "23",
  maharashtra: "27",
  manipur: "14",
  meghalaya: "17",
  mizoram: "15",
  nagaland: "13",
  odisha: "21",
  puducherry: "34",
  punjab: "03",
  rajasthan: "08",
  sikkim: "11",
  "tamil nadu": "33",
  telangana: "36",
  tripura: "16",
  "uttar pradesh": "09",
  uttarakhand: "05",
  "west bengal": "19",
};

export function stateCode(state: string) {
  return INDIA_STATE_CODES[state.trim().toLowerCase()] ?? null;
}

export function isIntraState(placeOfSupply: string, sellerState = brand.state) {
  const buyer = stateCode(placeOfSupply);
  const seller = stateCode(sellerState);
  if (buyer && seller) return buyer === seller;
  return placeOfSupply.trim().toLowerCase() === sellerState.trim().toLowerCase();
}

/** Prices are GST-inclusive rupees. taxable = round(amount * 100 / (100 + rate)). */
export function splitInclusiveGst(amountInr: number, gstPercent: number) {
  if (amountInr <= 0) return { taxableInr: 0, gstInr: 0 };
  const taxableInr = Math.round((amountInr * 100) / (100 + gstPercent));
  return { taxableInr, gstInr: amountInr - taxableInr };
}

export function allocateTax(gstInr: number, intraState: boolean) {
  if (!intraState) return { cgstInr: 0, sgstInr: 0, igstInr: gstInr };
  const cgstInr = Math.floor(gstInr / 2);
  return { cgstInr, sgstInr: gstInr - cgstInr, igstInr: 0 };
}

const BELOW_TWENTY = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function twoDigits(n: number) {
  if (n < 20) return BELOW_TWENTY[n] ?? "";
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one ? `${TENS[ten]}-${BELOW_TWENTY[one]}` : (TENS[ten] ?? "");
}

function threeDigits(n: number) {
  if (n < 100) return twoDigits(n);
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const head = `${BELOW_TWENTY[hundred]} hundred`;
  return rest ? `${head} ${twoDigits(rest)}` : head;
}

export function inrInWords(amount: number) {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return "Zero rupees only";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${crore < 100 ? twoDigits(crore) : threeDigits(crore)} crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} thousand`);
  if (rest) parts.push(threeDigits(rest));
  const words = parts.join(" ").replace(/\s+/g, " ").trim();
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} rupees only`;
}

export function financialYear(date = new Date()) {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}
