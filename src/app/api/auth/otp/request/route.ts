import { issueOtp } from "@/lib/otp";
import { json, readJson, rejectCrossOrigin } from "@/lib/http";
import { normalizeDestination } from "@/lib/utils";
import { z } from "zod";

const bodySchema = z.object({
  destination: z.string().trim().min(3).max(120),
});

export async function POST(req: Request) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;
  const parsed = bodySchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Enter an email or a 10-digit mobile number." }, 400);
  const destination = normalizeDestination(parsed.data.destination);
  if (!destination) return json({ error: "Enter an email or a 10-digit Indian mobile number." }, 400);
  try {
    const issued = await issueOtp({ destination: destination.destination, purpose: "LOGIN" });
    return json({ ok: true, channel: destination.channel, devCode: issued.devCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send a code.";
    const status = message.includes("Too many") ? 429 : message.includes("not configured") ? 503 : 400;
    return json({ error: message }, status);
  }
}
