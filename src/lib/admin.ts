import { desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  categories,
  departments,
  inventoryLogs,
  orderItems,
  orders,
  productVariants,
  products,
} from "@/lib/db/schema";

export async function dashboardStats() {
  const db = getDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [orderRows, lowRows, holdRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200),
    db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(sql`${productVariants.stockQuantity} - ${productVariants.reservedQuantity} <= ${productVariants.lowStockThreshold}`),
    db
      .select({ id: orders.id })
      .from(orders)
      .where(inArray(orders.status, ["RESERVED", "COD_PENDING"])),
  ]);
  const today = orderRows.filter((order) => order.createdAt >= start);
  const paid = new Set(["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"]);
  return {
    ordersToday: today.length,
    revenueTodayInr: today.filter((order) => paid.has(order.status)).reduce((sum, order) => sum + order.totalInr, 0),
    openFulfillment: orderRows.filter((order) => order.status === "CONFIRMED" || order.status === "PACKED").length,
    lowStock: lowRows.length,
    activeHolds: holdRows.length,
    recent: orderRows.slice(0, 8),
  };
}

export async function listCatalog() {
  const rows = await getDb()
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      isPublished: products.isPublished,
      hsnCode: products.hsnCode,
      gstRate: products.gstRate,
      department: departments.name,
      departmentSlug: departments.slug,
      category: categories.name,
    })
    .from(products)
    .innerJoin(departments, eq(departments.id, products.departmentId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .orderBy(departments.sortOrder, products.title);
  const ids = rows.map((row) => row.id);
  const variants = ids.length
    ? await getDb().select().from(productVariants).where(inArray(productVariants.productId, ids))
    : [];
  return rows.map((row) => {
    const mine = variants.filter((variant) => variant.productId === row.id);
    const available = mine.reduce((sum, variant) => sum + (variant.stockQuantity - variant.reservedQuantity), 0);
    const low = mine.some((variant) => variant.stockQuantity - variant.reservedQuantity <= variant.lowStockThreshold);
    return { ...row, skuCount: mine.length, available, low };
  });
}

export async function categoryOptions() {
  const depts = await getDb().select().from(departments).orderBy(departments.sortOrder);
  const cats = await getDb().select().from(categories).orderBy(categories.sortOrder);
  return cats.map((category) => {
    const department = depts.find((item) => item.id === category.departmentId);
    const parent = cats.find((item) => item.id === category.parentId);
    return {
      departmentSlug: department?.slug ?? "",
      departmentName: department?.name ?? "",
      slug: category.slug,
      name: parent ? `${parent.name} / ${category.name}` : category.name,
      isLeaf: !cats.some((item) => item.parentId === category.id),
    };
  });
}

export async function lowStockRows() {
  return getDb()
    .select({
      sku: productVariants.sku,
      sizeValue: productVariants.sizeValue,
      colorName: productVariants.colorName,
      stockQuantity: productVariants.stockQuantity,
      reservedQuantity: productVariants.reservedQuantity,
      lowStockThreshold: productVariants.lowStockThreshold,
      title: products.title,
      department: departments.name,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(departments, eq(departments.id, products.departmentId))
    .where(sql`${productVariants.stockQuantity} - ${productVariants.reservedQuantity} <= ${productVariants.lowStockThreshold}`)
    .orderBy(sql`${productVariants.stockQuantity} - ${productVariants.reservedQuantity}`);
}

export async function recentLogs() {
  return getDb()
    .select({
      id: inventoryLogs.id,
      action: inventoryLogs.action,
      quantity: inventoryLogs.quantity,
      stockAfter: inventoryLogs.stockAfter,
      reservedAfter: inventoryLogs.reservedAfter,
      note: inventoryLogs.note,
      createdAt: inventoryLogs.createdAt,
      sku: productVariants.sku,
      orderNumber: orders.orderNumber,
    })
    .from(inventoryLogs)
    .innerJoin(productVariants, eq(productVariants.id, inventoryLogs.variantId))
    .leftJoin(orders, eq(orders.id, inventoryLogs.orderId))
    .orderBy(desc(inventoryLogs.createdAt))
    .limit(40);
}

export async function listOrders(limit = 100) {
  const rows = await getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  const ids = rows.map((row) => row.id);
  const items = ids.length ? await getDb().select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return rows.map((order) => ({
    ...order,
    pieces: items.filter((item) => item.orderId === order.id).reduce((sum, item) => sum + item.quantity, 0),
  }));
}
