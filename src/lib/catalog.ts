import { and, asc, desc, eq, exists, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, departments, productVariants, products } from "@/lib/db/schema";
import type { ListingProduct, NavDepartment, ProductAttributes, SizeType } from "@/lib/types";

export type Facets = {
  colors: { name: string; hex: string }[];
  fabrics: string[];
  sizeTypes: SizeType[];
  categories: { name: string; slug: string }[];
};

export async function getNavTree(): Promise<NavDepartment[]> {
  const depts = await getDb().select().from(departments).orderBy(asc(departments.sortOrder));
  const cats = await getDb().select().from(categories).orderBy(asc(categories.sortOrder));
  return depts.map((department) => {
    const mine = cats.filter((category) => category.departmentId === department.id);
    const parents = mine.filter((category) => !category.parentId);
    return {
      name: department.name,
      slug: department.slug,
      categories: parents.map((parent) => ({
        name: parent.name,
        slug: parent.slug,
        children: mine
          .filter((category) => category.parentId === parent.id)
          .map((category) => ({ name: category.name, slug: category.slug })),
      })),
    };
  });
}

async function categoryScope(departmentId: string, slug?: string) {
  const rows = await getDb().select().from(categories).where(eq(categories.departmentId, departmentId));
  if (!slug) return { ids: rows.map((row) => row.id), name: null as string | null };
  const root = rows.find((row) => row.slug === slug);
  if (!root) return null;
  const ids = [root.id];
  const walk = (id: string) => {
    for (const row of rows) {
      if (row.parentId === id) {
        ids.push(row.id);
        walk(row.id);
      }
    }
  };
  walk(root.id);
  return { ids, name: root.name };
}

export async function listProducts(filters: {
  departmentSlug?: string;
  categorySlug?: string;
  sizeType?: SizeType;
  color?: string;
  fabric?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc";
}) {
  const db = getDb();
  let department: { id: string; name: string; slug: string; description: string | null } | null = null;
  if (filters.departmentSlug) {
    const [row] = await db.select().from(departments).where(eq(departments.slug, filters.departmentSlug)).limit(1);
    if (!row) return null;
    department = row;
  }

  let categoryName: string | null = null;
  let categoryIds: string[] | null = null;
  if (department && filters.categorySlug) {
    const scope = await categoryScope(department.id, filters.categorySlug);
    if (!scope) return null;
    categoryIds = scope.ids;
    categoryName = scope.name;
  }

  const base = [eq(products.isPublished, true)];
  if (department) base.push(eq(products.departmentId, department.id));
  if (categoryIds) base.push(inArray(products.categoryId, categoryIds));
  if (filters.fabric) base.push(sql`${products.attributes}->>'fabric' = ${filters.fabric}`);

  const variantFilters = [];
  if (filters.color) variantFilters.push(eq(productVariants.colorName, filters.color));
  if (filters.sizeType) variantFilters.push(eq(productVariants.sizeType, filters.sizeType));
  if (filters.minPrice != null) variantFilters.push(sql`${productVariants.sellingPriceInr} >= ${filters.minPrice}`);
  if (filters.maxPrice != null) variantFilters.push(sql`${productVariants.sellingPriceInr} <= ${filters.maxPrice}`);
  if (filters.inStock) {
    variantFilters.push(sql`${productVariants.stockQuantity} - ${productVariants.reservedQuantity} > 0`);
  }

  const where = and(
    ...base,
    variantFilters.length
      ? exists(
          db
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(and(eq(productVariants.productId, products.id), ...variantFilters)),
        )
      : undefined,
  );

  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      attributes: products.attributes,
      createdAt: products.createdAt,
      department: departments.name,
      departmentSlug: departments.slug,
      category: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(departments, eq(departments.id, products.departmentId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(where)
    .orderBy(desc(products.createdAt))
    .limit(60);

  const ids = rows.map((row) => row.id);
  const variantRows = ids.length
    ? await db.select().from(productVariants).where(inArray(productVariants.productId, ids))
    : [];

  const productsOut: ListingProduct[] = rows
    .map((row) => {
      const all = variantRows.filter((variant) => variant.productId === row.id);
      const matching = all.filter((variant) => {
        if (filters.color && variant.colorName !== filters.color) return false;
        if (filters.sizeType && variant.sizeType !== filters.sizeType) return false;
        if (filters.minPrice != null && variant.sellingPriceInr < filters.minPrice) return false;
        if (filters.maxPrice != null && variant.sellingPriceInr > filters.maxPrice) return false;
        const available = variant.stockQuantity - variant.reservedQuantity;
        if (filters.inStock && available <= 0) return false;
        return true;
      });
      if (!matching.length) return null;
      const priced = [...matching].sort((a, b) => a.sellingPriceInr - b.sellingPriceInr)[0]!;
      const colors = uniqueColors(all);
      const attributes = (row.attributes ?? {}) as ProductAttributes;
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        department: row.department,
        departmentSlug: row.departmentSlug,
        category: row.category,
        categorySlug: row.categorySlug,
        fabric: attributes.fabric ?? "",
        priceInr: priced.sellingPriceInr,
        mrpInr: priced.mrpInr,
        available: matching.reduce((sum, variant) => sum + (variant.stockQuantity - variant.reservedQuantity), 0),
        swatch: priced.colorHex,
        colors,
        createdAt: row.createdAt.toISOString(),
      } satisfies ListingProduct;
    })
    .filter((row): row is ListingProduct => Boolean(row));

  if (filters.sort === "price_asc") productsOut.sort((a, b) => a.priceInr - b.priceInr);
  if (filters.sort === "price_desc") productsOut.sort((a, b) => b.priceInr - a.priceInr);

  const facetBase = [eq(products.isPublished, true)];
  if (department) facetBase.push(eq(products.departmentId, department.id));
  if (categoryIds) facetBase.push(inArray(products.categoryId, categoryIds));
  const facetRows = await db
    .select({
      colorName: productVariants.colorName,
      colorHex: productVariants.colorHex,
      sizeType: productVariants.sizeType,
      fabric: sql<string | null>`${products.attributes}->>'fabric'`,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...facetBase));

  const facets: Facets = {
    colors: uniqueColors(facetRows.map((row) => ({ colorName: row.colorName, colorHex: row.colorHex }))),
    fabrics: [...new Set(facetRows.map((row) => row.fabric).filter((value): value is string => Boolean(value)))].sort(),
    sizeTypes: [...new Set(facetRows.map((row) => row.sizeType))],
    categories: uniquePairs(facetRows.map((row) => ({ name: row.categoryName, slug: row.categorySlug }))),
  };

  return { products: productsOut, facets, department, categoryName };
}

function uniqueColors(rows: { colorName: string; colorHex: string }[]) {
  const map = new Map<string, string>();
  for (const row of rows) map.set(row.colorName, row.colorHex);
  return [...map.entries()].map(([name, hex]) => ({ name, hex }));
}

function uniquePairs(rows: { name: string; slug: string }[]) {
  const map = new Map<string, string>();
  for (const row of rows) map.set(row.slug, row.name);
  return [...map.entries()].map(([slug, name]) => ({ slug, name }));
}

export async function getProductBySlug(slug: string) {
  const [row] = await getDb()
    .select({
      product: products,
      departmentName: departments.name,
      departmentSlug: departments.slug,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(departments, eq(departments.id, products.departmentId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.slug, slug), eq(products.isPublished, true)))
    .limit(1);
  if (!row) return null;

  const variants = await getDb()
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, row.product.id))
    .orderBy(asc(productVariants.colorName), asc(productVariants.sizeValue));

  const similarRows = await getDb()
    .select({ id: products.id, title: products.title, slug: products.slug, attributes: products.attributes, createdAt: products.createdAt, department: departments.name, departmentSlug: departments.slug, category: categories.name, categorySlug: categories.slug })
    .from(products)
    .innerJoin(departments, eq(departments.id, products.departmentId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.categoryId, row.product.categoryId), eq(products.isPublished, true), sql`${products.id} <> ${row.product.id}`))
    .limit(4);

  const similarIds = similarRows.map((item) => item.id);
  const similarVariants = similarIds.length
    ? await getDb().select().from(productVariants).where(inArray(productVariants.productId, similarIds))
    : [];

  const similar: ListingProduct[] = similarRows.map((item) => {
    const all = similarVariants.filter((variant) => variant.productId === item.id);
    const priced = [...all].sort((a, b) => a.sellingPriceInr - b.sellingPriceInr)[0];
    const attributes = (item.attributes ?? {}) as ProductAttributes;
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      department: item.department,
      departmentSlug: item.departmentSlug,
      category: item.category,
      categorySlug: item.categorySlug,
      fabric: attributes.fabric ?? "",
      priceInr: priced?.sellingPriceInr ?? 0,
      mrpInr: priced?.mrpInr ?? 0,
      available: all.reduce((sum, variant) => sum + (variant.stockQuantity - variant.reservedQuantity), 0),
      swatch: priced?.colorHex ?? "#E6E0D4",
      colors: uniqueColors(all),
      createdAt: item.createdAt.toISOString(),
    };
  });

  return {
    ...row.product,
    attributes: (row.product.attributes ?? {}) as ProductAttributes,
    departmentName: row.departmentName,
    departmentSlug: row.departmentSlug,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    variants: variants.map((variant) => ({
      ...variant,
      available: variant.stockQuantity - variant.reservedQuantity,
    })),
    similar,
  };
}

export async function searchProducts(q: string, limit = 8) {
  const term = q.trim().slice(0, 80);
  if (term.length < 2) return [];
  const like = `%${term.replace(/[%_\\]/g, "")}%`;
  return getDb()
    .select({
      title: products.title,
      slug: products.slug,
      department: departments.name,
      fabric: sql<string | null>`${products.attributes}->>'fabric'`,
    })
    .from(products)
    .innerJoin(departments, eq(departments.id, products.departmentId))
    .where(
      and(
        eq(products.isPublished, true),
        or(
          ilike(products.title, like),
          ilike(products.description, like),
          sql`${products.attributes}->>'fabric' ILIKE ${like}`,
          sql`${products.attributes}->>'occasion' ILIKE ${like}`,
          sql`${products.attributes}->>'age_group' ILIKE ${like}`,
          exists(
            getDb()
              .select({ id: productVariants.id })
              .from(productVariants)
              .where(and(eq(productVariants.productId, products.id), ilike(productVariants.sku, like))),
          ),
        ),
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

export async function listPublishedSlugs() {
  return getDb()
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .where(eq(products.isPublished, true));
}
