import { eq } from "drizzle-orm";
import { getDb, getSql } from "@/lib/db";
import {
  categories,
  departments,
  inventoryLogs,
  pincodeServiceability,
  productVariants,
  products,
  users,
} from "@/lib/db/schema";
import type { ProductAttributes, SizeType } from "@/lib/types";

type Size = { type: SizeType; value: string };
type Color = { name: string; hex: string; code: string };
type SeedProduct = {
  title: string;
  slug: string;
  department: string;
  category: string;
  description: string;
  hsnCode: string;
  gstRate: number;
  attributes: ProductAttributes;
  skuPrefix: string;
  mrpInr: number;
  sellingPriceInr: number;
  sizes: Size[];
  colors: Color[];
  stock: number;
  featured?: boolean;
};

const alpha = (...values: string[]): Size[] => values.map((value) => ({ type: "ALPHA", value }));
const numeric = (...values: string[]): Size[] => values.map((value) => ({ type: "NUMERIC", value }));
const kids = (...values: string[]): Size[] => values.map((value) => ({ type: "KIDS_AGE", value }));

const catalog: SeedProduct[] = [
  {
    title: "Kalbadevi Handloom Kurta",
    slug: "kalbadevi-handloom-kurta",
    department: "men",
    category: "kurtas",
    description: "A straight cotton kurta woven for the humidity between Churchgate and a late dinner. Side slits, mother-of-pearl buttons, and a collar that stays put on a local train.",
    hsnCode: "6203",
    gstRate: 12,
    attributes: { fabric: "Cotton handloom", fit: "Straight", occasion: "Everyday festive", wash_care: "Gentle machine, low spin, shade dry" },
    skuPrefix: "SS-M-KUR",
    mrpInr: 3290,
    sellingPriceInr: 2490,
    sizes: alpha("S", "M", "L", "XL"),
    colors: [
      { name: "Ivory", hex: "#F3EDE2", code: "IVY" },
      { name: "Indigo", hex: "#1E3354", code: "IND" },
    ],
    stock: 16,
    featured: true,
  },
  {
    title: "Mulberry Bandhgala",
    slug: "mulberry-bandhgala",
    department: "men",
    category: "festive",
    description: "A closed-collar bandhgala in a silk-cotton blend. Cut for a sangeet in Bandra or a winter wedding in Delhi, with a lining that does not cling in a ballroom.",
    hsnCode: "6203",
    gstRate: 12,
    attributes: { fabric: "Silk cotton", fit: "Tailored", occasion: "Wedding", wash_care: "Dry clean only" },
    skuPrefix: "SS-M-BAN",
    mrpInr: 11990,
    sellingPriceInr: 8990,
    sizes: alpha("S", "M", "L", "XL"),
    colors: [
      { name: "Maroon", hex: "#6E2430", code: "MAR" },
      { name: "Black", hex: "#161616", code: "BLK" },
    ],
    stock: 8,
    featured: true,
  },
  {
    title: "Ivory Sherwani",
    slug: "ivory-sherwani",
    department: "men",
    category: "sherwanis",
    description: "A floor-grazing sherwani with a restrained zari line at the placket. Made for the groom who wants the ceremony without the costume.",
    hsnCode: "6203",
    gstRate: 12,
    attributes: { fabric: "Silk blend", fit: "Straight", occasion: "Wedding", wash_care: "Dry clean only" },
    skuPrefix: "SS-M-SHR",
    mrpInr: 24000,
    sellingPriceInr: 18900,
    sizes: alpha("S", "M", "L", "XL"),
    colors: [{ name: "Ivory", hex: "#F4EFE6", code: "IVY" }],
    stock: 5,
  },
  {
    title: "Churchgate Oxford Shirt",
    slug: "churchgate-oxford-shirt",
    department: "men",
    category: "shirts",
    description: "A washed oxford with a softer collar for offices that switched off the air conditioning at six. Button cuffs, curved hem, no fuss.",
    hsnCode: "6205",
    gstRate: 12,
    attributes: { fabric: "Cotton oxford", fit: "Regular", occasion: "Work", wash_care: "Machine wash cold, hang dry" },
    skuPrefix: "SS-M-OXF",
    mrpInr: 2490,
    sellingPriceInr: 1890,
    sizes: alpha("S", "M", "L", "XL"),
    colors: [
      { name: "White", hex: "#F7F7F5", code: "WHT" },
      { name: "Sky", hex: "#C5D5E4", code: "SKY" },
    ],
    stock: 18,
    featured: true,
  },
  {
    title: "Local Line Trouser",
    slug: "local-line-trouser",
    department: "men",
    category: "trousers",
    description: "A cotton-twill trouser with a slight taper. The waist is numeric because a 32 should be a 32, whether you are in Fort or Cyber Hub.",
    hsnCode: "6203",
    gstRate: 12,
    attributes: { fabric: "Cotton twill", fit: "Tapered", occasion: "Work", wash_care: "Machine wash cold, medium iron" },
    skuPrefix: "SS-M-TRS",
    mrpInr: 2790,
    sellingPriceInr: 2190,
    sizes: numeric("30", "32", "34", "36"),
    colors: [
      { name: "Khaki", hex: "#C2A878", code: "KHA" },
      { name: "Charcoal", hex: "#2A2A2A", code: "CHR" },
    ],
    stock: 14,
  },
  {
    title: "Platform Cotton Tee",
    slug: "platform-cotton-tee",
    department: "men",
    category: "t-shirts",
    description: "Combed cotton, a heavier jersey than a marketplace tee, dyed in turmeric and botanical. The shoulder holds a backpack strap.",
    hsnCode: "6109",
    gstRate: 5,
    attributes: { fabric: "Combed cotton", fit: "Relaxed", occasion: "Daily", wash_care: "Machine wash cold, inside out" },
    skuPrefix: "SS-M-TEE",
    mrpInr: 1290,
    sellingPriceInr: 899,
    sizes: alpha("S", "M", "L", "XL"),
    colors: [
      { name: "Turmeric", hex: "#E5A93B", code: "TUR" },
      { name: "Botanical", hex: "#1B4D3E", code: "BOT" },
    ],
    stock: 24,
  },
  {
    title: "Marine Drive Run Short",
    slug: "marine-drive-run-short",
    department: "men",
    category: "activewear",
    description: "A 7-inch short in recycled polyester with a brief liner. Pocket zip stays shut when the sea wind picks up.",
    hsnCode: "6103",
    gstRate: 12,
    attributes: { fabric: "Recycled polyester", fit: "Relaxed", occasion: "Training", wash_care: "Machine wash cold, no softener" },
    skuPrefix: "SS-M-RUN",
    mrpInr: 1990,
    sellingPriceInr: 1490,
    sizes: alpha("S", "M", "L"),
    colors: [
      { name: "Black", hex: "#1A1A1A", code: "BLK" },
      { name: "Sage", hex: "#7D9B86", code: "SAG" },
    ],
    stock: 12,
  },
  {
    title: "Kanjeevaram Temple Border Saree",
    slug: "kanjeevaram-temple-saree",
    department: "women",
    category: "sarees",
    description: "A silk saree with a temple border in botanical green and a marigold body. Woven for a Chennai muhurtham and a Mumbai reception the same week.",
    hsnCode: "5007",
    gstRate: 12,
    attributes: { fabric: "Silk", fit: "Drape", occasion: "Wedding", wash_care: "Dry clean only" },
    skuPrefix: "SS-W-SAR",
    mrpInr: 18990,
    sellingPriceInr: 14890,
    sizes: alpha("Free"),
    colors: [
      { name: "Marigold", hex: "#E2A23A", code: "MAR" },
      { name: "Temple Green", hex: "#1B4D3E", code: "TMP" },
    ],
    stock: 6,
    featured: true,
  },
  {
    title: "Bandra Cotton Kurta Set",
    slug: "bandra-cotton-kurta-set",
    department: "women",
    category: "kurtas",
    description: "A straight kurta with narrow trousers and a light dupatta. Cotton that survives a humid commute and still looks dressed for lunch.",
    hsnCode: "6204",
    gstRate: 12,
    attributes: { fabric: "Cotton", fit: "Straight", occasion: "Day festive", wash_care: "Gentle machine, shade dry" },
    skuPrefix: "SS-W-SET",
    mrpInr: 3590,
    sellingPriceInr: 2790,
    sizes: alpha("XS", "S", "M", "L", "XL"),
    colors: [
      { name: "Dust", hex: "#E7C9C4", code: "DUS" },
      { name: "Ivory", hex: "#F3EDE2", code: "IVY" },
    ],
    stock: 14,
    featured: true,
  },
  {
    title: "Garden Lehenga",
    slug: "garden-lehenga",
    department: "women",
    category: "lehengas",
    description: "A lehenga with a short trail and a blouse cut for dancing, not just photographs. The flare is net over a cotton lining.",
    hsnCode: "6204",
    gstRate: 12,
    attributes: { fabric: "Net and silk", fit: "Flared", occasion: "Sangeet", wash_care: "Dry clean only" },
    skuPrefix: "SS-W-LEH",
    mrpInr: 21000,
    sellingPriceInr: 16500,
    sizes: alpha("XS", "S", "M", "L"),
    colors: [{ name: "Marigold", hex: "#E5A93B", code: "MAR" }],
    stock: 5,
  },
  {
    title: "Colaba Slip Dress",
    slug: "colaba-slip-dress",
    department: "women",
    category: "dresses",
    description: "A bias-cut slip in viscose that skims rather than sticks. For dinners when the city has finally cooled.",
    hsnCode: "6204",
    gstRate: 12,
    attributes: { fabric: "Viscose", fit: "Bias", occasion: "Evening", wash_care: "Hand wash cold or dry clean" },
    skuPrefix: "SS-W-DRS",
    mrpInr: 4290,
    sellingPriceInr: 3290,
    sizes: alpha("XS", "S", "M", "L"),
    colors: [
      { name: "Ink", hex: "#1A1A1A", code: "INK" },
      { name: "Clay", hex: "#C48B6A", code: "CLY" },
    ],
    stock: 10,
    featured: true,
  },
  {
    title: "Matunga Camp Shirt",
    slug: "matunga-camp-shirt",
    department: "women",
    category: "tops",
    description: "A camp-collar shirt in cotton poplin. Wear it open over the rib tee or buttoned for a meeting in BKC.",
    hsnCode: "6206",
    gstRate: 12,
    attributes: { fabric: "Cotton poplin", fit: "Relaxed", occasion: "Work", wash_care: "Machine wash cold, hang dry" },
    skuPrefix: "SS-W-TOP",
    mrpInr: 2290,
    sellingPriceInr: 1690,
    sizes: alpha("XS", "S", "M", "L", "XL"),
    colors: [
      { name: "White", hex: "#F7F7F5", code: "WHT" },
      { name: "Botanical", hex: "#1B4D3E", code: "BOT" },
    ],
    stock: 16,
  },
  {
    title: "Fort Wide-Leg Trouser",
    slug: "fort-wide-leg-trouser",
    department: "women",
    category: "trousers",
    description: "A linen-blend wide leg with a high rise and pockets that actually hold a phone. Pressed crease optional.",
    hsnCode: "6204",
    gstRate: 12,
    attributes: { fabric: "Linen blend", fit: "Wide", occasion: "Work", wash_care: "Gentle machine, hang dry, steam" },
    skuPrefix: "SS-W-TRS",
    mrpInr: 3190,
    sellingPriceInr: 2490,
    sizes: numeric("26", "28", "30", "32"),
    colors: [
      { name: "Sand", hex: "#E6D7C3", code: "SND" },
      { name: "Black", hex: "#1A1A1A", code: "BLK" },
    ],
    stock: 12,
  },
  {
    title: "Versova Rib Tee",
    slug: "versova-rib-tee",
    department: "women",
    category: "t-shirts",
    description: "An organic cotton rib with a neck that does not gape. The sea colour is dyed to fade slowly, not in one wash.",
    hsnCode: "6109",
    gstRate: 5,
    attributes: { fabric: "Organic cotton", fit: "Relaxed", occasion: "Daily", wash_care: "Machine wash cold" },
    skuPrefix: "SS-W-TEE",
    mrpInr: 1490,
    sellingPriceInr: 990,
    sizes: alpha("XS", "S", "M", "L"),
    colors: [
      { name: "Sea", hex: "#8FB8C9", code: "SEA" },
      { name: "White", hex: "#F7F7F5", code: "WHT" },
    ],
    stock: 20,
  },
  {
    title: "Terrace Yoga Set",
    slug: "terrace-yoga-set",
    department: "women",
    category: "activewear",
    description: "A cotton-modal vest and a full-length legging. Soft enough for a 7 a.m. terrace class, covered enough for the auto home.",
    hsnCode: "6104",
    gstRate: 12,
    attributes: { fabric: "Cotton modal", fit: "Close", occasion: "Studio", wash_care: "Machine wash cold, no dryer" },
    skuPrefix: "SS-W-YOG",
    mrpInr: 2990,
    sellingPriceInr: 2290,
    sizes: alpha("XS", "S", "M", "L"),
    colors: [
      { name: "Sage", hex: "#7D9B86", code: "SAG" },
      { name: "Clay", hex: "#C48B6A", code: "CLY" },
    ],
    stock: 11,
  },
  {
    title: "Festive Mirror Kurta",
    slug: "festive-mirror-kurta",
    department: "kids",
    category: "kurtas",
    description: "A boys' cotton kurta with small mirrors that are stitched, not glued. Made for the cousin's wedding and the photograph after.",
    hsnCode: "6203",
    gstRate: 12,
    attributes: { fabric: "Cotton", fit: "Straight", occasion: "Festive", wash_care: "Gentle machine, shade dry", age_group: "4-11 years" },
    skuPrefix: "SS-K-MIR",
    mrpInr: 1690,
    sellingPriceInr: 1290,
    sizes: kids("4-5Y", "6-7Y", "8-9Y", "10-11Y"),
    colors: [
      { name: "Ivory", hex: "#F3EDE2", code: "IVY" },
      { name: "Turmeric", hex: "#E5A93B", code: "TUR" },
    ],
    stock: 12,
    featured: true,
  },
  {
    title: "Block-Print Frock",
    slug: "block-print-frock",
    department: "kids",
    category: "frocks",
    description: "A cambric frock with a gathered skirt and a block print that stays on the outside of the print, not the child's skin.",
    hsnCode: "6204",
    gstRate: 12,
    attributes: { fabric: "Cotton cambric", fit: "Flared", occasion: "Festive", wash_care: "Gentle machine, mild detergent", age_group: "2-9 years" },
    skuPrefix: "SS-K-FRK",
    mrpInr: 1590,
    sellingPriceInr: 1190,
    sizes: kids("2-3Y", "4-5Y", "6-7Y", "8-9Y"),
    colors: [
      { name: "Indigo", hex: "#1E3354", code: "IND" },
      { name: "Madder", hex: "#A33B32", code: "MAD" },
    ],
    stock: 12,
    featured: true,
  },
  {
    title: "School-Run Polo",
    slug: "school-run-polo",
    department: "kids",
    category: "polos",
    description: "A pique polo that still looks like a uniform after the school bag has been dropped in the hallway. Reinforced placket.",
    hsnCode: "6109",
    gstRate: 5,
    attributes: { fabric: "Cotton pique", fit: "Regular", occasion: "Daily", wash_care: "Machine wash warm", age_group: "4-13 years" },
    skuPrefix: "SS-K-POL",
    mrpInr: 999,
    sellingPriceInr: 799,
    sizes: kids("4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"),
    colors: [
      { name: "White", hex: "#F7F7F5", code: "WHT" },
      { name: "Botanical", hex: "#1B4D3E", code: "BOT" },
    ],
    stock: 20,
  },
  {
    title: "Maidan Joggers",
    slug: "maidan-joggers",
    department: "kids",
    category: "joggers",
    description: "French terry joggers with a rib cuff that stays above the ankle during a game. Knees are doubled.",
    hsnCode: "6103",
    gstRate: 5,
    attributes: { fabric: "French terry", fit: "Relaxed", occasion: "Play", wash_care: "Machine wash cold", age_group: "4-13 years" },
    skuPrefix: "SS-K-JOG",
    mrpInr: 1390,
    sellingPriceInr: 999,
    sizes: kids("4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"),
    colors: [
      { name: "Charcoal", hex: "#2A2A2A", code: "CHR" },
      { name: "Sage", hex: "#7D9B86", code: "SAG" },
    ],
    stock: 16,
  },
];

const stockOverrides: Record<string, number> = {
  "SS-M-TEE-TUR-XL": 0,
  "SS-M-KUR-IVY-XL": 3,
};

const pincodes: Array<typeof pincodeServiceability.$inferInsert> = [
  ["400001", "Fort, Mumbai", "Maharashtra", "Mumbai"],
  ["400050", "Bandra West, Mumbai", "Maharashtra", "Mumbai"],
  ["400070", "Kurla, Mumbai", "Maharashtra", "Mumbai"],
  ["400601", "Thane", "Maharashtra", "Mumbai"],
  ["110001", "Connaught Place, New Delhi", "Delhi", "Delhi NCR"],
  ["110016", "Hauz Khas, New Delhi", "Delhi", "Delhi NCR"],
  ["110070", "Vasant Kunj, New Delhi", "Delhi", "Delhi NCR"],
  ["122001", "Gurugram", "Haryana", "Delhi NCR"],
  ["122002", "DLF Phase, Gurugram", "Haryana", "Delhi NCR"],
  ["201301", "Noida", "Uttar Pradesh", "Delhi NCR"],
  ["201001", "Ghaziabad", "Uttar Pradesh", "Delhi NCR"],
  ["560001", "MG Road, Bengaluru", "Karnataka", "Bengaluru"],
  ["560038", "Indiranagar, Bengaluru", "Karnataka", "Bengaluru"],
  ["560103", "Bellandur, Bengaluru", "Karnataka", "Bengaluru"],
  ["500001", "Abids, Hyderabad", "Telangana", "Hyderabad"],
  ["500034", "Banjara Hills, Hyderabad", "Telangana", "Hyderabad"],
  ["500081", "Madhapur, Hyderabad", "Telangana", "Hyderabad"],
  ["600001", "Parrys, Chennai", "Tamil Nadu", "Chennai"],
  ["600020", "Adyar, Chennai", "Tamil Nadu", "Chennai"],
  ["600040", "Anna Nagar, Chennai", "Tamil Nadu", "Chennai"],
  ["700001", "Dalhousie, Kolkata", "West Bengal", "Kolkata"],
  ["700019", "Ballygunge, Kolkata", "West Bengal", "Kolkata"],
  ["700091", "Salt Lake, Kolkata", "West Bengal", "Kolkata"],
  ["411001", "Pune Cantonment", "Maharashtra", "Pune"],
  ["411038", "Kothrud, Pune", "Maharashtra", "Pune"],
  ["411057", "Hinjewadi, Pune", "Maharashtra", "Pune"],
].map(([pincode, city, state, metro]) => ({
  pincode,
  city,
  state,
  metro,
  codAvailable: true,
  etaMinDays: 2,
  etaMaxDays: 4,
  shippingInr: 49,
}));

const tree = [
  {
    slug: "men",
    name: "Men",
    description: "Shirts, kurtas, and trousers for the working week and the wedding after it.",
    categories: [
      { slug: "ethnic", name: "Ethnic", children: [{ slug: "kurtas", name: "Kurtas" }, { slug: "sherwanis", name: "Sherwanis" }] },
      { slug: "western", name: "Western", children: [{ slug: "shirts", name: "Shirts" }, { slug: "trousers", name: "Trousers" }] },
      { slug: "casual", name: "Casual", children: [{ slug: "t-shirts", name: "T-shirts" }] },
      { slug: "festive", name: "Festive", children: [] },
      { slug: "activewear", name: "Activewear", children: [] },
    ],
  },
  {
    slug: "women",
    name: "Women",
    description: "Sarees, sets, dresses, and the trouser you can wear to the office.",
    categories: [
      { slug: "ethnic", name: "Ethnic", children: [{ slug: "sarees", name: "Sarees" }, { slug: "kurtas", name: "Kurta sets" }, { slug: "lehengas", name: "Lehengas" }] },
      { slug: "western", name: "Western", children: [{ slug: "dresses", name: "Dresses" }, { slug: "tops", name: "Tops" }, { slug: "trousers", name: "Trousers" }] },
      { slug: "casual", name: "Casual", children: [{ slug: "t-shirts", name: "T-shirts" }] },
      { slug: "festive", name: "Festive", children: [] },
      { slug: "activewear", name: "Activewear", children: [] },
    ],
  },
  {
    slug: "kids",
    name: "Kids",
    description: "Festive clothes, school-run polos, and joggers for the maidan.",
    categories: [
      { slug: "ethnic", name: "Ethnic", children: [{ slug: "kurtas", name: "Kurtas" }, { slug: "frocks", name: "Frocks" }] },
      { slug: "western", name: "Western", children: [{ slug: "shirts", name: "Shirts" }] },
      { slug: "casual", name: "Casual", children: [{ slug: "polos", name: "Polos" }] },
      { slug: "festive", name: "Festive", children: [] },
      { slug: "activewear", name: "Activewear", children: [{ slug: "joggers", name: "Joggers" }] },
    ],
  },
];

function skuFor(prefix: string, color: string, size: string) {
  return `${prefix}-${color}-${size.replace(/\s+/g, "").toUpperCase()}`;
}

async function main() {
  const existing = await getDb().select({ id: departments.id }).from(departments).limit(1);
  if (existing.length && process.env.SEED_RESET !== "true") {
    console.log("Catalog already seeded. Set SEED_RESET=true to wipe and seed again.");
    return;
  }
  if (process.env.SEED_RESET === "true") {
    await getSql()`TRUNCATE TABLE inventory_logs, order_items, orders, otp_challenges, cart_items, carts, product_variants, products, categories, departments, pincode_serviceability, users RESTART IDENTITY CASCADE`;
  }

  await getDb().insert(users).values([
    { name: "SS Admin", email: "admin@ssapparel.example", phone: "+919876543210", role: "ADMIN" },
    { name: "SS Floor", email: "floor@ssapparel.example", phone: "+919876543211", role: "FULFILLMENT" },
  ]);
  await getDb().insert(pincodeServiceability).values(pincodes);

  const departmentIds = new Map<string, string>();
  for (const [index, department] of tree.entries()) {
    const [row] = await getDb()
      .insert(departments)
      .values({ name: department.name, slug: department.slug, description: department.description, sortOrder: index })
      .returning();
    if (!row) throw new Error("Department insert failed");
    departmentIds.set(department.slug, row.id);
    let sort = 0;
    for (const category of department.categories) {
      const [parent] = await getDb()
        .insert(categories)
        .values({ departmentId: row.id, name: category.name, slug: category.slug, sortOrder: sort })
        .returning();
      sort += 1;
      if (!parent) throw new Error("Category insert failed");
      for (const child of category.children) {
        await getDb().insert(categories).values({
          departmentId: row.id,
          parentId: parent.id,
          name: child.name,
          slug: child.slug,
          sortOrder: sort,
        });
        sort += 1;
      }
    }
  }

  const categoryRows = await getDb().select().from(categories);
  let variantCount = 0;
  for (const [index, product] of catalog.entries()) {
    const departmentId = departmentIds.get(product.department);
    const category = categoryRows.find((row) => row.departmentId === departmentId && row.slug === product.category);
    if (!departmentId || !category) throw new Error(`Missing category ${product.department}/${product.category}`);
    const createdAt = product.featured ? new Date(Date.now() - index * 60_000) : new Date(Date.now() - 10 * 86400000);
    const [inserted] = await getDb()
      .insert(products)
      .values({
        title: product.title,
        slug: product.slug,
        description: product.description,
        departmentId,
        categoryId: category.id,
        hsnCode: product.hsnCode,
        gstRate: product.gstRate,
        attributes: product.attributes,
        images: [],
        isPublished: true,
        createdAt,
        updatedAt: createdAt,
      })
      .returning();
    if (!inserted) throw new Error("Product insert failed");

    for (const color of product.colors) {
      for (const size of product.sizes) {
        const sku = skuFor(product.skuPrefix, color.code, size.value);
        const stockQuantity = stockOverrides[sku] ?? product.stock;
        const [variant] = await getDb()
          .insert(productVariants)
          .values({
            productId: inserted.id,
            sku,
            sizeType: size.type,
            sizeValue: size.value,
            colorName: color.name,
            colorHex: color.hex,
            mrpInr: product.mrpInr,
            sellingPriceInr: product.sellingPriceInr,
            stockQuantity,
            reservedQuantity: 0,
            lowStockThreshold: 5,
          })
          .returning();
        if (!variant) throw new Error("Variant insert failed");
        variantCount += 1;
        if (stockQuantity > 0) {
          await getDb().insert(inventoryLogs).values({
            variantId: variant.id,
            action: "STOCK_IN",
            quantity: stockQuantity,
            stockAfter: stockQuantity,
            reservedAfter: 0,
            note: "opening_stock",
          });
        }
      }
    }
  }

  const low = await getDb()
    .select({ sku: productVariants.sku })
    .from(productVariants)
    .where(eq(productVariants.sku, "SS-M-KUR-IVY-XL"));
  console.log(`Seeded ${catalog.length} products, ${variantCount} SKUs, ${pincodes.length} pincodes.`);
  console.log("Admin login: +91 98765 43210 or admin@ssapparel.example");
  console.log("Floor login: +91 98765 43211");
  console.log(low.length ? "Low-stock sample SKU: SS-M-KUR-IVY-XL" : "Low-stock sample missing");
}

main()
  .then(async () => {
    await getSql().end({ timeout: 5 });
  })
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
    try {
      await getSql().end({ timeout: 1 });
    } catch {
      /* already closed */
    }
  });
