import type { SizeType } from "@/lib/types";

export type SizeRow = {
  size: string;
  chest?: string;
  waist?: string;
  hip?: string;
  height?: string;
};

export function sizeGuideFor(department: string, sizeType: SizeType) {
  const dept = department.toLowerCase();
  if (sizeType === "KIDS_AGE" || dept === "kids") {
    return {
      title: "Kids — age and height",
      note: "Height is in centimetres. Chest is a body measurement in inches. If your child is between ages, use height.",
      columns: ["Age", "Height", "Chest"],
      rows: [
        ["2-3Y", "92–98 cm", "21 in"],
        ["4-5Y", "104–110 cm", "23 in"],
        ["6-7Y", "116–122 cm", "25 in"],
        ["8-9Y", "128–134 cm", "27 in"],
        ["10-11Y", "140–146 cm", "29 in"],
        ["12-13Y", "152–158 cm", "32 in"],
      ],
    };
  }
  if (sizeType === "NUMERIC") {
    const women = dept === "women";
    return {
      title: women ? "Women — waist" : "Men — waist",
      note: "Waist is a body measurement in inches, taken over the hip bone. If you are between sizes, take the larger one for handloom and linen.",
      columns: ["Size", "Waist", "Hip"],
      rows: women
        ? [
            ["26", "26 in", "36 in"],
            ["28", "28 in", "38 in"],
            ["30", "30 in", "40 in"],
            ["32", "32 in", "42 in"],
            ["34", "34 in", "44 in"],
          ]
        : [
            ["30", "30 in", "38 in"],
            ["32", "32 in", "40 in"],
            ["34", "34 in", "42 in"],
            ["36", "36 in", "44 in"],
            ["38", "38 in", "46 in"],
            ["40", "40 in", "48 in"],
          ],
    };
  }
  if (dept === "women") {
    return {
      title: "Women — bust",
      note: "Bust is a body measurement in inches. Draped pieces such as sarees are marked Free.",
      columns: ["Size", "Bust", "Waist", "Hip"],
      rows: [
        ["XS", "32 in", "25 in", "35 in"],
        ["S", "34 in", "27 in", "37 in"],
        ["M", "36 in", "29 in", "39 in"],
        ["L", "38 in", "32 in", "42 in"],
        ["XL", "41 in", "35 in", "45 in"],
        ["XXL", "44 in", "38 in", "48 in"],
        ["Free", "Saree drape", "—", "—"],
      ],
    };
  }
  return {
    title: "Men — chest",
    note: "Chest is a body measurement in inches, taken under the arms. If you are between sizes, take the larger one for handloom.",
    columns: ["Size", "Chest", "Waist"],
    rows: [
      ["XS", "36 in", "30 in"],
      ["S", "38 in", "32 in"],
      ["M", "40 in", "34 in"],
      ["L", "42 in", "36 in"],
      ["XL", "44 in", "38 in"],
      ["XXL", "46 in", "41 in"],
    ],
  };
}
