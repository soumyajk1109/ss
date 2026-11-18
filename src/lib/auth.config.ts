import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/types";

function asRole(value: unknown): Role {
  if (value === "ADMIN" || value === "FULFILLMENT" || value === "CUSTOMER") return value;
  return "CUSTOMER";
}

/**
 * Edge-safe auth config. Middleware must not import the database.
 * The Node auth module spreads this and adds the OTP credentials provider.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/account" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user && "role" in user) {
        token.role = asRole(user.role);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = asRole(token.role);
      }
      return session;
    },
    authorized({ auth, request }) {
      if (!request.nextUrl.pathname.startsWith("/admin")) return true;
      const role = auth?.user?.role;
      return role === "ADMIN" || role === "FULFILLMENT";
    },
  },
} satisfies NextAuthConfig;
