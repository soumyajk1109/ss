import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(10).max(16),
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
});

export const checkoutSchema = z.object({
  email: z.string().trim().email().optional().or(z.literal("")),
  method: z.enum(["RAZORPAY", "COD"]),
  address: addressSchema,
});

export const cartAddSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10).optional(),
});

export const cartSetSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(0).max(10),
});

const variantInput = z.object({
  sku: z.string().trim().min(3).max(64),
  sizeType: z.enum(["ALPHA", "NUMERIC", "KIDS_AGE"]),
  sizeValue: z.string().trim().min(1).max(16),
  colorName: z.string().trim().min(2).max(40),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  mrpInr: z.number().int().positive().max(500000),
  sellingPriceInr: z.number().int().positive().max(500000),
  stockQuantity: z.number().int().min(0).max(100000),
  lowStockThreshold: z.number().int().min(0).max(1000).optional(),
});

export const productCreateSchema = z
  .object({
    title: z.string().trim().min(3).max(140),
    description: z.string().trim().min(10).max(2000),
    departmentSlug: z.string().trim().min(2).max(40),
    categorySlug: z.string().trim().min(2).max(40),
    hsnCode: z.string().trim().regex(/^\d{4,8}$/),
    gstRate: z.number().int().min(0).max(40),
    attributes: z.object({
      fabric: z.string().trim().max(80).optional().or(z.literal("")),
      fit: z.string().trim().max(80).optional().or(z.literal("")),
      occasion: z.string().trim().max(80).optional().or(z.literal("")),
      wash_care: z.string().trim().max(160).optional().or(z.literal("")),
      age_group: z.string().trim().max(40).optional().or(z.literal("")),
    }),
    variants: z.array(variantInput).min(1).max(80),
  })
  .superRefine((value, ctx) => {
    const skus = new Set<string>();
    value.variants.forEach((variant, index) => {
      if (variant.mrpInr < variant.sellingPriceInr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", index, "mrpInr"],
          message: "MRP must be at least the selling price.",
        });
      }
      if (skus.has(variant.sku)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", index, "sku"],
          message: "Duplicate SKU in this product.",
        });
      }
      skus.add(variant.sku);
    });
  });

export const publishSchema = z.object({
  id: z.string().uuid(),
  isPublished: z.boolean(),
});

export const stockAdjustSchema = z.object({
  sku: z.string().trim().min(3).max(64),
  quantity: z.number().int().min(0).max(100000),
  mode: z.enum(["add", "set"]),
  note: z.string().trim().max(200).optional(),
});

export const csvImportSchema = z.object({
  csv: z.string().min(1).max(500_000),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]),
});

export const orderAccessSchema = z.object({
  orderNumber: z.string().trim().min(6).max(32),
  accessToken: z.string().trim().min(16).max(128),
});

export const verifyPaymentSchema = orderAccessSchema.extend({
  razorpay_order_id: z.string().min(3),
  razorpay_payment_id: z.string().min(3),
  razorpay_signature: z.string().min(3),
});

export const codSchema = z.object({
  orderNumber: z.string().trim().min(6).max(32),
  accessToken: z.string().trim().min(16).max(128),
  action: z.enum(["verify", "resend"]),
  code: z.string().trim().regex(/^\d{6}$/).optional(),
});
