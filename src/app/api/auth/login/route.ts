import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE, demoSessionToken, resolvedDemoPassword } from "@/lib/demo-auth";

export async function POST(request: NextRequest) {
  let password = "";
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { password?: string };
    password = body.password?.trim() ?? "";
  } else {
    const form = await request.formData().catch(() => null);
    password = String(form?.get("password") ?? "").trim();
  }

  const expected = resolvedDemoPassword();
  if (!password || password !== expected) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  const token = await demoSessionToken(expected);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });
  return response;
}
