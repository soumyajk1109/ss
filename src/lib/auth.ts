import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { verifyLoginOtp } from "@/lib/otp";

/**
 * Customer login is email or Indian mobile OTP.
 * Roles live on users.role and are copied into the JWT for the admin panel.
 *
 * Supabase Auth can replace authorize() if you already issue Supabase sessions:
 * verify that JWT on the server, upsert users by phone or email, and keep
 * users.role as the only source for /admin. Never trust a role sent by the browser.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "otp",
      name: "Email or phone OTP",
      credentials: {
        destination: { label: "Email or mobile", type: "text" },
        code: { label: "Code", type: "text" },
      },
      authorize: async (credentials) => {
        const destination = credentials?.destination;
        const code = credentials?.code;
        if (typeof destination !== "string" || typeof code !== "string") return null;
        const user = await verifyLoginOtp(destination, code);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name ?? "SS customer",
          email: user.email ?? undefined,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],
});
