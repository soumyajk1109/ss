import { searchProducts } from "@/lib/catalog";
import { json } from "@/lib/http";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    const results = await searchProducts(q, 8);
    return json({ results });
  } catch (error) {
    console.error(error);
    return json({ results: [] });
  }
}
