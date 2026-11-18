import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Address, ProductAttributes, Role } from "@/lib/types";

/**
 * SS catalog + inventory.
 *
 * Stock rule: available = stock_quantity - reserved_quantity.
 * Checkout locks variant rows (FOR UPDATE, id order) and increments reserved_quantity.
 * payment.captured or a verified COD OTP decrements stock_quantity and reserved_quantity (SOLD).
 * Failed or 15-minute-expired checkouts decrement reserved_quantity only (RELEASED).
 *
 * Lock order, to avoid deadlocks:
 * 1. orders row
 * 2. product_variants in ascending id
 * A new checkout has no order yet, so it locks variants only, then inserts the order.
 */

export const userRoleEnum = pgEnum("user_role", ["CUSTOMER", "ADMIN", "FULFILLMENT"]);
export const sizeTypeEnum = pgEnum("size_type", ["ALPHA", "NUMERIC", "KIDS_AGE"]);
export const inventoryActionEnum = pgEnum("inventory_action", [
  "STOCK_IN",
  "RESERVED",
  "SOLD",
  "RELEASED",
  "RETURNED",
  "ADJUSTMENT",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "RESERVED",
  "COD_PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "EXPIRED",
  "RETURNED",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["RAZORPAY", "COD"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "CAPTURED",
  "FAILED",
  "COD_PENDING",
  "COD_VERIFIED",
]);
export const otpPurposeEnum = pgEnum("otp_purpose", ["LOGIN", "COD"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone").unique(),
  role: userRoleEnum("role").notNull().default("CUSTOMER"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("categories_department_slug").on(t.departmentId, t.slug),
    index("categories_parent_idx").on(t.parentId),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    hsnCode: text("hsn_code").notNull(),
    /** Percent. Apparel seed uses 5 at or under ₹1,000 and 12 above. Finance owns this column. */
    gstRate: integer("gst_rate").notNull(),
    attributes: jsonb("attributes").$type<ProductAttributes>().notNull().default({}),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_department_category_idx").on(t.departmentId, t.categoryId),
    index("products_attributes_gin").using("gin", t.attributes),
    check("products_gst_rate_nonneg", sql`${t.gstRate} >= 0 AND ${t.gstRate} <= 40`),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    sizeType: sizeTypeEnum("size_type").notNull(),
    sizeValue: text("size_value").notNull(),
    colorName: text("color_name").notNull(),
    colorHex: text("color_hex").notNull(),
    mrpInr: integer("mrp_inr").notNull(),
    sellingPriceInr: integer("selling_price_inr").notNull(),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  },
  (t) => [
    index("variants_product_idx").on(t.productId),
    index("variants_color_idx").on(t.colorName),
    check("variants_stock_nonneg", sql`${t.stockQuantity} >= 0 AND ${t.reservedQuantity} >= 0`),
    check("variants_reserved_within_stock", sql`${t.reservedQuantity} <= ${t.stockQuantity}`),
    check("variants_price_valid", sql`${t.sellingPriceInr} > 0 AND ${t.mrpInr} >= ${t.sellingPriceInr}`),
  ],
);

export const pincodeServiceability = pgTable("pincode_serviceability", {
  pincode: text("pincode").primaryKey(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  metro: text("metro").notNull(),
  codAvailable: boolean("cod_available").notNull().default(true),
  etaMinDays: integer("eta_min_days").notNull(),
  etaMaxDays: integer("eta_max_days").notNull(),
  shippingInr: integer("shipping_inr").notNull(),
});

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("carts_user_idx").on(t.userId)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
  },
  (t) => [
    uniqueIndex("cart_items_cart_variant").on(t.cartId, t.variantId),
    check("cart_items_qty", sql`${t.quantity} > 0 AND ${t.quantity} <= 10`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    accessToken: text("access_token").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: orderStatusEnum("status").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull(),
    email: text("email"),
    phone: text("phone").notNull(),
    shippingAddress: jsonb("shipping_address").$type<Address>().notNull(),
    pincode: text("pincode").notNull(),
    placeOfSupply: text("place_of_supply").notNull(),
    subtotalInr: integer("subtotal_inr").notNull(),
    discountInr: integer("discount_inr").notNull().default(0),
    shippingInr: integer("shipping_inr").notNull().default(0),
    codFeeInr: integer("cod_fee_inr").notNull().default(0),
    taxableInr: integer("taxable_inr").notNull(),
    cgstInr: integer("cgst_inr").notNull().default(0),
    sgstInr: integer("sgst_inr").notNull().default(0),
    igstInr: integer("igst_inr").notNull().default(0),
    totalInr: integer("total_inr").notNull(),
    razorpayOrderId: text("razorpay_order_id").unique(),
    razorpayPaymentId: text("razorpay_payment_id"),
    reservationExpiresAt: timestamp("reservation_expires_at", { withTimezone: true }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    invoiceNumber: text("invoice_number").unique(),
    internalNote: text("internal_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_status_expiry_idx").on(t.status, t.reservationExpiresAt),
    index("orders_user_idx").on(t.userId),
    index("orders_phone_idx").on(t.phone),
    check("orders_total_nonneg", sql`${t.totalInr} >= 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productTitle: text("product_title").notNull(),
    productSlug: text("product_slug").notNull(),
    sku: text("sku").notNull(),
    hsnCode: text("hsn_code").notNull(),
    gstRate: integer("gst_rate").notNull(),
    sizeType: sizeTypeEnum("size_type").notNull(),
    sizeValue: text("size_value").notNull(),
    colorName: text("color_name").notNull(),
    quantity: integer("quantity").notNull(),
    mrpInr: integer("mrp_inr").notNull(),
    sellingPriceInr: integer("selling_price_inr").notNull(),
    lineTotalInr: integer("line_total_inr").notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    check("order_items_qty", sql`${t.quantity} > 0`),
  ],
);

export const inventoryLogs = pgTable(
  "inventory_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    action: inventoryActionEnum("action").notNull(),
    quantity: integer("quantity").notNull(),
    stockAfter: integer("stock_after").notNull(),
    reservedAfter: integer("reserved_after").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("inventory_logs_variant_idx").on(t.variantId, t.createdAt),
    index("inventory_logs_order_idx").on(t.orderId),
    check("inventory_logs_qty", sql`${t.quantity} > 0`),
  ],
);

export const otpChallenges = pgTable(
  "otp_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    destination: text("destination").notNull(),
    purpose: otpPurposeEnum("purpose").notNull(),
    codeHash: text("code_hash").notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("otp_destination_idx").on(t.destination, t.purpose, t.createdAt)],
);

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  categories: many(categories),
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  department: one(departments, { fields: [categories.departmentId], references: [departments.id] }),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "category_tree" }),
  children: many(categories, { relationName: "category_tree" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  department: one(departments, { fields: [products.departmentId], references: [departments.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  logs: many(inventoryLogs),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
}));

export type UserRow = typeof users.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof productVariants.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type RoleValue = Role;
