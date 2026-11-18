export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function rejectCrossOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return null;
  if (!isSameOrigin(req)) {
    return json({ error: "Cross-origin request blocked." }, 403);
  }
  return null;
}
