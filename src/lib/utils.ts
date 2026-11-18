import { createHash, timingSafeEqual } from "crypto";

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatWhen(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function isLightHex(hex: string) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return true;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return true;
  return (r * 299 + g * 587 + b * 114) / 1000 > 165;
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function hashOtp(code: string) {
  const pepper = process.env.AUTH_SECRET ?? "ss-dev-pepper";
  return createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

export function normalizeDestination(input: string): { channel: "email" | "phone"; destination: string } | null {
  const raw = input.trim().toLowerCase();
  if (raw.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return null;
    return { channel: "email", destination: raw };
  }
  const digits = raw.replace(/\D/g, "");
  const ten =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  if (!/^[6-9]\d{9}$/.test(ten)) return null;
  return { channel: "phone", destination: `+91${ten}` };
}

export function safeNextPath(next: string | undefined, fallback = "/account") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export function oneParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
