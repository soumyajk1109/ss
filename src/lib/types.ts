export type Role = "CUSTOMER" | "ADMIN" | "FULFILLMENT";

export type SizeType = "ALPHA" | "NUMERIC" | "KIDS_AGE";

export type ProductAttributes = {
  fabric?: string;
  fit?: string;
  occasion?: string;
  wash_care?: string;
  age_group?: string;
};

export type Address = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type PaymentMethod = "RAZORPAY" | "COD";

export type OrderStatus =
  | "RESERVED"
  | "COD_PENDING"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "EXPIRED"
  | "RETURNED";

export type NavCategory = {
  name: string;
  slug: string;
  children: { name: string; slug: string }[];
};

export type NavDepartment = {
  name: string;
  slug: string;
  categories: NavCategory[];
};

export type ListingProduct = {
  id: string;
  title: string;
  slug: string;
  department: string;
  departmentSlug: string;
  category: string;
  categorySlug: string;
  fabric: string;
  priceInr: number;
  mrpInr: number;
  available: number;
  swatch: string;
  colors: { name: string; hex: string }[];
  createdAt: string;
};

export type CartLine = {
  variantId: string;
  sku: string;
  title: string;
  slug: string;
  sizeType: SizeType;
  sizeValue: string;
  colorName: string;
  colorHex: string;
  quantity: number;
  available: number;
  mrpInr: number;
  sellingPriceInr: number;
  lineTotalInr: number;
  published: boolean;
};
