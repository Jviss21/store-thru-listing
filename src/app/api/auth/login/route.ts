import { NextRequest, NextResponse } from "next/server";
import { authenticateCredentials } from "@/lib/auth/credentials";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Legacy password gate — prefer NextAuth signIn via /login.
 * Accepts { email?, password } and returns identity hint; does NOT set NextAuth cookie.
 * Kept so older clients fail clearly.
 */
export async function POST(request: NextRequest) {
  let password = "";
  let email = "";
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as {
      password?: string;
      email?: string;
    };
    password = body.password?.trim() ?? "";
    email = body.email?.trim() ?? "";
  } else {
    const form = await request.formData().catch(() => null);
    password = String(form?.get("password") ?? "").trim();
    email = String(form?.get("email") ?? "").trim();
  }

  const ip = clientIp(request);
  const emailKey = email.toLowerCase() || "anon";
  const rl = rateLimit(`login-api:${emailKey}:${ip}`, 12, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${rl.retryAfterSec}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  const identity = await authenticateCredentials(email || undefined, password);
  if (!identity) {
    return NextResponse.json(
      {
        ok: false,
        error: "Incorrect credentials. Use /login with email + pilot password.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    deprecated: true,
    message: "Use NextAuth sign-in at /login (signIn credentials). Identity validated.",
    user: {
      email: identity.email,
      orgId: identity.orgId,
      isOps: identity.isOps,
    },
  });
}
