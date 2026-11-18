import { randomInt } from "crypto";
import { and, desc, eq, gt, gte, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { otpChallenges, users } from "@/lib/db/schema";
import { hashOtp, normalizeDestination, safeEqual } from "@/lib/utils";

const LOGIN_TTL_MS = 10 * 60 * 1000;
const COD_TTL_MS = 5 * 60 * 1000;

export async function deliverOtp(destination: string, code: string, purpose: string) {
  if (process.env.OTP_DEBUG === "true") {
    console.info(`[otp] ${purpose} ${destination} ${code}`);
    return;
  }
  throw new Error(
    "OTP delivery is not configured. Set OTP_DEBUG=true only on a local machine, or send the code from deliverOtp().",
  );
}

export async function issueOtp(input: {
  destination: string;
  purpose: "LOGIN" | "COD";
  orderId?: string;
}) {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const recent = await getDb()
    .select({ id: otpChallenges.id })
    .from(otpChallenges)
    .where(and(eq(otpChallenges.destination, input.destination), gte(otpChallenges.createdAt, since)));
  if (recent.length >= 5) {
    throw new Error("Too many codes for this number. Wait fifteen minutes.");
  }

  const code = String(randomInt(100000, 1000000));
  const ttl = input.purpose === "COD" ? COD_TTL_MS : LOGIN_TTL_MS;
  await getDb()
    .update(otpChallenges)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(otpChallenges.destination, input.destination),
        eq(otpChallenges.purpose, input.purpose),
        isNull(otpChallenges.consumedAt),
      ),
    );
  await getDb().insert(otpChallenges).values({
    destination: input.destination,
    purpose: input.purpose,
    codeHash: hashOtp(code),
    orderId: input.orderId,
    expiresAt: new Date(Date.now() + ttl),
  });
  await deliverOtp(input.destination, code, input.purpose);
  return { devCode: process.env.OTP_DEBUG === "true" ? code : undefined };
}

export async function verifyOtp(input: {
  destination: string;
  purpose: "LOGIN" | "COD";
  code: string;
  orderId?: string;
}) {
  const filters = [
    eq(otpChallenges.destination, input.destination),
    eq(otpChallenges.purpose, input.purpose),
    isNull(otpChallenges.consumedAt),
    gt(otpChallenges.expiresAt, new Date()),
  ];
  if (input.orderId) filters.push(eq(otpChallenges.orderId, input.orderId));
  const [row] = await getDb()
    .select()
    .from(otpChallenges)
    .where(and(...filters))
    .orderBy(desc(otpChallenges.createdAt))
    .limit(1);
  if (!row) return { ok: false as const, reason: "That code has expired. Request another." };
  if (row.attempts >= 5) return { ok: false as const, reason: "Too many attempts. Request another code." };
  if (!safeEqual(hashOtp(input.code), row.codeHash)) {
    await getDb()
      .update(otpChallenges)
      .set({ attempts: row.attempts + 1 })
      .where(eq(otpChallenges.id, row.id));
    return { ok: false as const, reason: "That code doesn't match." };
  }
  await getDb().update(otpChallenges).set({ consumedAt: new Date() }).where(eq(otpChallenges.id, row.id));
  return { ok: true as const };
}

export async function verifyLoginOtp(rawDestination: string, code: string) {
  const parsed = normalizeDestination(rawDestination);
  if (!parsed || !/^\d{6}$/.test(code)) return null;
  const result = await verifyOtp({ destination: parsed.destination, purpose: "LOGIN", code });
  if (!result.ok) return null;
  const [existing] =
    parsed.channel === "email"
      ? await getDb().select().from(users).where(eq(users.email, parsed.destination)).limit(1)
      : await getDb().select().from(users).where(eq(users.phone, parsed.destination)).limit(1);
  if (existing) return existing;
  const [created] = await getDb()
    .insert(users)
    .values(
      parsed.channel === "email"
        ? { email: parsed.destination, name: parsed.destination.split("@")[0] ?? "SS customer", role: "CUSTOMER" }
        : { phone: parsed.destination, name: "SS customer", role: "CUSTOMER" },
    )
    .returning();
  return created ?? null;
}
