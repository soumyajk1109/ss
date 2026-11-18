import { and, eq } from "drizzle-orm";
import { requireRole } from "@/lib/guards";
import { getDb } from "@/lib/db";
import { categories, departments, inventoryLogs, productVariants, products } from "@/lib/db/schema";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { slugify } from "@/lib/utils";
import { productCreateSchema, publishSchema } from "@/lib/validators";

export async function GET() {
  const gate = await requireRole(["ADMIN", "FULFILLMENT"]);
  if (gate.response) return gate.response;
  const rows = await getDb()
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      isPublished: products.isPublished,
      department: departments.name,
      category: categories.name,
    })
    .from(products)
    .innerJoin(departments, eq(departments.id, products.departmentId))
    .innerJoin(categories, eq(categories.id, products.categoryId));
  return json({ products: rows });
}

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const gate = await requireRole(["ADMIN"]);
  if (gate.response) return gate.response;
  const parsed = productCreateSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Check the product fields.", issues: parsed.error.flatten() }, 400);
  const input = parsed.data;
  const [department] = await getDb().select().from(departments).where(eq(departments.slug, input.departmentSlug)).limit(1);
  if (!department) return json({ error: "Unknown department." }, 400);
  const [category] = await getDb()
    .select()
    .from(categories)
    .where(and(eq(categories.departmentId, department.id), eq(categories.slug, input.categorySlug)))
    .limit(1);
  if (!category) return json({ error: "Unknown category for that department." }, 400);

  let slug = slugify(input.title);
  const clash = await getDb().select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
  if (clash.length) slug = `${slug}-${Date.now().toString(36)}`;

  try {
    const created = await getDb().transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          title: input.title,
          slug,
          description: input.description,
          departmentId: department.id,
          categoryId: category.id,
          hsnCode: input.hsnCode,
          gstRate: input.gstRate,
          attributes: {
            fabric: input.attributes.fabric || undefined,
            fit: input.attributes.fit || undefined,
            occasion: input.attributes.occasion || undefined,
            wash_care: input.attributes.wash_care || undefined,
            age_group: input.attributes.age_group || undefined,
          },
          images: [],
          isPublished: true,
        })
        .returning();
      if (!product) throw new Error("Product was not created.");
      for (const variant of input.variants) {
        const [row] = await tx
          .insert(productVariants)
          .values({
            productId: product.id,
            sku: variant.sku,
            sizeType: variant.sizeType,
            sizeValue: variant.sizeValue,
            colorName: variant.colorName,
            colorHex: variant.colorHex,
            mrpInr: variant.mrpInr,
            sellingPriceInr: variant.sellingPriceInr,
            stockQuantity: variant.stockQuantity,
            reservedQuantity: 0,
            lowStockThreshold: variant.lowStockThreshold ?? 5,
          })
          .returning();
        if (row && variant.stockQuantity > 0) {
          await tx.insert(inventoryLogs).values({
            variantId: row.id,
            action: "STOCK_IN",
            quantity: variant.stockQuantity,
            stockAfter: variant.stockQuantity,
            reservedAfter: 0,
            note: `catalog_create by:${gate.session!.user.id}`,
          });
        }
      }
      return product;
    });
    return json({ id: created.id, slug: created.slug }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the product.";
    if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) {
      return json({ error: "A SKU or slug already exists." }, 409);
    }
    console.error(error);
    return json({ error: "Could not create the product." }, 500);
  }
}

export async function PATCH(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const gate = await requireRole(["ADMIN"]);
  if (gate.response) return gate.response;
  const parsed = publishSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Missing product." }, 400);
  await getDb()
    .update(products)
    .set({ isPublished: parsed.data.isPublished, updatedAt: new Date() })
    .where(eq(products.id, parsed.data.id));
  return json({ ok: true });
}
