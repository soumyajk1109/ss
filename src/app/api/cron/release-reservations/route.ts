import { releaseExpiredReservations } from "@/lib/inventory";
import { json } from "@/lib/http";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) return json({ error: "Unauthorized" }, 401);
  const released = await releaseExpiredReservations();
  return json({ released });
}
