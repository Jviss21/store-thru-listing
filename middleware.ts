import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE, demoSessionToken, resolvedDemoPassword } from "@/lib/demo-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg" ||
    pathname === "/hammoq-logo.png" ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const expected = await demoSessionToken(resolvedDemoPassword());
  const cookie = request.cookies.get(DEMO_COOKIE)?.value;

  if (cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
