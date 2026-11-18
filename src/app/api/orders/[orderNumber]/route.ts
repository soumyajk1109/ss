import { json } from "@/lib/http";
import { getOrderBundle, publicOrder, viewerCanRead } from "@/lib/orders";

export async function GET(req: Request, context: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await context.params;
  const token = new URL(req.url).searchParams.get("t") ?? undefined;
  const bundle = await getOrderBundle(orderNumber);
  if (!bundle || !(await viewerCanRead(bundle.order, token))) return json({ error: "Order not found." }, 404);
  return json({
    order: publicOrder(bundle.order, bundle.items),
  });
}
