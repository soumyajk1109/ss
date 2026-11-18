import type { Role } from "@/lib/types";
import { auth } from "@/lib/auth";
import { json } from "@/lib/http";

export async function requireRole(roles: readonly Role[]) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || !role || !roles.includes(role)) {
    return {
      session: null,
      response: json({ error: "Sign in with an SS staff account." }, 401),
    };
  }
  return { session, response: null };
}
