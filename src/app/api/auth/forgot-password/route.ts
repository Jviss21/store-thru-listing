import { NextRequest, NextResponse } from "next/server";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Light password-reset stub.
 * When email is configured: acknowledges request without revealing whether the
 * address exists, and emails a "contact your admin / use a new invite" note
 * until a full reset-token table lands.
 * When not configured: honest 503-style message (still 200 to avoid email oracle
 * on configured path only — here we tell the truth for operators).
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit(`forgot:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many requests. Try again in ${rl.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({
      ok: false,
      emailSent: false,
      error:
        "Password reset email is not configured. Ask an Admin to send a new invite, or set RESEND_API_KEY + EMAIL_FROM.",
    });
  }

  const result = await sendEmail({
    to: email,
    subject: "Password help — Hammoq Store thru Listing",
    text: [
      "We received a password help request for this address.",
      "",
      "Self-serve reset tokens are not enabled yet. Please ask your org Admin",
      "to send you a fresh teammate invite (which lets you set a new password),",
      "or contact Hammoq Ops if you are locked out of admin access.",
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `<p>We received a password help request for this address.</p>
<p>Self-serve reset tokens are not enabled yet. Ask your org <strong>Admin</strong> to send a fresh teammate invite (you can set a new password on accept), or contact Hammoq Ops.</p>
<p style="color:#64748b;font-size:12px">If you did not request this, ignore this email.</p>`,
  });

  if (!result.sent) {
    return NextResponse.json({
      ok: false,
      emailSent: false,
      error: result.error || "Could not send password help email",
    });
  }

  return NextResponse.json({
    ok: true,
    emailSent: true,
    message:
      "If that address is on file, we sent password help instructions. Admins can also re-invite you to set a new password.",
  });
}
