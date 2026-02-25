import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes — always accessible
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  // Unauthenticated → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = (user as { role: string }).role;

  // Coach routes require COACH role
  if (pathname.startsWith("/coach") && role !== "COACH") {
    const url = new URL("/runner", req.url);
    return NextResponse.redirect(url);
  }

  // Runner routes require RUNNER role
  if (pathname.startsWith("/runner") && role !== "RUNNER") {
    const url = new URL("/coach", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
