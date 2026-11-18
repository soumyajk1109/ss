CREATE TYPE "public"."inventory_action" AS ENUM('STOCK_IN', 'RESERVED', 'SOLD', 'RELEASED', 'RETURNED', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('RESERVED', 'COD_PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'EXPIRED', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('LOGIN', 'COD');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('RAZORPAY', 'COD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'CAPTURED', 'FAILED', 'COD_PENDING', 'COD_VERIFIED');--> statement-breakpoint
CREATE TYPE "public"."size_type" AS ENUM('ALPHA', 'NUMERIC', 'KIDS_AGE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CUSTOMER', 'ADMIN', 'FULFILLMENT');--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "cart_items_qty" CHECK ("cart_items"."quantity" > 0 AND "cart_items"."quantity" <= 10)
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "departments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "inventory_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"order_id" uuid,
	"action" "inventory_action" NOT NULL,
	"quantity" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"reserved_after" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_logs_qty" CHECK ("inventory_logs"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"product_title" text NOT NULL,
	"product_slug" text NOT NULL,
	"sku" text NOT NULL,
	"hsn_code" text NOT NULL,
	"gst_rate" integer NOT NULL,
	"size_type" "size_type" NOT NULL,
	"size_value" text NOT NULL,
	"color_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"mrp_inr" integer NOT NULL,
	"selling_price_inr" integer NOT NULL,
	"line_total_inr" integer NOT NULL,
	CONSTRAINT "order_items_qty" CHECK ("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"access_token" text NOT NULL,
	"user_id" uuid,
	"status" "order_status" NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"pincode" text NOT NULL,
	"place_of_supply" text NOT NULL,
	"subtotal_inr" integer NOT NULL,
	"discount_inr" integer DEFAULT 0 NOT NULL,
	"shipping_inr" integer DEFAULT 0 NOT NULL,
	"cod_fee_inr" integer DEFAULT 0 NOT NULL,
	"taxable_inr" integer NOT NULL,
	"cgst_inr" integer DEFAULT 0 NOT NULL,
	"sgst_inr" integer DEFAULT 0 NOT NULL,
	"igst_inr" integer DEFAULT 0 NOT NULL,
	"total_inr" integer NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"reservation_expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"invoice_number" text,
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "orders_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "orders_total_nonneg" CHECK ("orders"."total_inr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"destination" text NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"code_hash" text NOT NULL,
	"order_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pincode_serviceability" (
	"pincode" text PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"metro" text NOT NULL,
	"cod_available" boolean DEFAULT true NOT NULL,
	"eta_min_days" integer NOT NULL,
	"eta_max_days" integer NOT NULL,
	"shipping_inr" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"size_type" "size_type" NOT NULL,
	"size_value" text NOT NULL,
	"color_name" text NOT NULL,
	"color_hex" text NOT NULL,
	"mrp_inr" integer NOT NULL,
	"selling_price_inr" integer NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "variants_stock_nonneg" CHECK ("product_variants"."stock_quantity" >= 0 AND "product_variants"."reserved_quantity" >= 0),
	CONSTRAINT "variants_reserved_within_stock" CHECK ("product_variants"."reserved_quantity" <= "product_variants"."stock_quantity"),
	CONSTRAINT "variants_price_valid" CHECK ("product_variants"."selling_price_inr" > 0 AND "product_variants"."mrp_inr" >= "product_variants"."selling_price_inr")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"department_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"hsn_code" text NOT NULL,
	"gst_rate" integer NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_gst_rate_nonneg" CHECK ("products"."gst_rate" >= 0 AND "products"."gst_rate" <= 40)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_variant" ON "cart_items" USING btree ("cart_id","variant_id");--> statement-breakpoint
CREATE INDEX "carts_user_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_department_slug" ON "categories" USING btree ("department_id","slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "inventory_logs_variant_idx" ON "inventory_logs" USING btree ("variant_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_logs_order_idx" ON "inventory_logs" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_status_expiry_idx" ON "orders" USING btree ("status","reservation_expires_at");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_phone_idx" ON "orders" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "otp_destination_idx" ON "otp_challenges" USING btree ("destination","purpose","created_at");--> statement-breakpoint
CREATE INDEX "variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "variants_color_idx" ON "product_variants" USING btree ("color_name");--> statement-breakpoint
CREATE INDEX "products_department_category_idx" ON "products" USING btree ("department_id","category_id");--> statement-breakpoint
CREATE INDEX "products_attributes_gin" ON "products" USING gin ("attributes");