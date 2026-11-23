import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);
const handle = auth as unknown as NextMiddleware;

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return handle(request, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
