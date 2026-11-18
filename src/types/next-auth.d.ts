import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "ADMIN" | "FULFILLMENT";
      phone?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "CUSTOMER" | "ADMIN" | "FULFILLMENT";
    phone?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "CUSTOMER" | "ADMIN" | "FULFILLMENT";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "CUSTOMER" | "ADMIN" | "FULFILLMENT";
  }
}

export {};
