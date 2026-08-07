import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { clearEbayConnectionsByAccountId } from "@/lib/api/marketplaces/ebay-oauth";

/**
 * eBay Marketplace Account Deletion / closure notifications.
 *
 * GET  — challenge verification: SHA256(challengeCode + verificationToken + endpoint)
 * POST — best-effort clear stored refresh tokens for the notified account
 *
 * ECDSA signature verification TODO (production hardening).
 */

function verificationToken(): string {
  return (
    process.env.EBAY_NOTIFICATION_VERIFICATION_TOKEN?.trim() ||
    process.env.EBAY_ACCOUNT_DELETION_TOKEN?.trim() ||
    ""
  );
}

function endpointUrl(request: Request): string {
  const configured = process.env.EBAY_ACCOUNT_DELETION_ENDPOINT?.trim();
  if (configured) return configured;
  return new URL(request.url).origin + "/api/marketplaces/ebay/account-deletion";
}

export async function GET(request: Request) {
  const challengeCode = new URL(request.url).searchParams.get("challenge_code");
  const token = verificationToken();
  if (!challengeCode || !token) {
    return NextResponse.json(
      { ok: false, error: "Missing challenge_code or EBAY_NOTIFICATION_VERIFICATION_TOKEN" },
      { status: 400 }
    );
  }
  const endpoint = endpointUrl(request);
  const hash = createHash("sha256")
    .update(challengeCode)
    .update(token)
    .update(endpoint)
    .digest("hex");
  return NextResponse.json({ challengeResponse: hash });
}

export async function POST(request: Request) {
  // TODO: verify eBay ECDSA signature header before acting on payload
  let body: {
    notification?: {
      data?: {
        userId?: string;
        username?: string;
        eiasToken?: string;
      };
    };
    metadata?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true, acknowledged: true });
  }

  const accountId =
    body.notification?.data?.userId ||
    body.notification?.data?.eiasToken ||
    body.notification?.data?.username ||
    "";

  let cleared = 0;
  if (accountId) {
    const result = await clearEbayConnectionsByAccountId(accountId);
    cleared = result.cleared;
  }

  console.info("[ebay/account-deletion]", {
    accountId: accountId || "(none)",
    cleared,
    // signatureVerified: false — ECDSA TODO
  });

  return NextResponse.json({ ok: true, acknowledged: true, cleared });
}
