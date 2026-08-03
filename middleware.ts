import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canAccessPath, canViewMasterEventLog } from "@/lib/roles";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const role = String(token?.role ?? "Viewer");
    const isOps = Boolean(token?.isOps);

    // Ops console: Hammoq staff only
    if (pathname.startsWith("/ops") && !isOps) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", "/ops");
      url.searchParams.set("ops", "1");
      return NextResponse.redirect(url);
    }

    // Master event log: Admin or Hammoq Ops only
    if (
      (pathname.startsWith("/admin/audit") || pathname.startsWith("/reports/events")) &&
      !canViewMasterEventLog(role, isOps)
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("denied", "master-events");
      return NextResponse.redirect(url);
    }

    // Section / admin route guards (UI RoleGate is the friendly fallback)
    if (token && !canAccessPath(pathname, role, isOps)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("denied", "role");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (
          pathname.startsWith("/_next") ||
          pathname.startsWith("/api/auth") ||
          pathname === "/login" ||
          pathname === "/favicon.ico" ||
          pathname === "/favicon.svg" ||
          pathname === "/hammoq-logo.png" ||
          /\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$/i.test(pathname)
        ) {
          return true;
        }
        return Boolean(token);
      },
    },
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
