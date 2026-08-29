import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async (req: NextRequest & { auth: { user?: { id?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuth = !!session?.user?.id;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicApi = pathname.startsWith("/api/auth");
  const isProtectedApi = pathname.startsWith("/api/") && !isPublicApi;

  if (isPublicApi) return NextResponse.next();

  // API routes must return JSON — never redirect to the login page (breaks fetch().json()).
  if (!isAuth && isProtectedApi) {
    return NextResponse.json({ success: false, message: "Unauthorized. Please log in again." }, { status: 401 });
  }

  if (!isAuth && !isAuthPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
