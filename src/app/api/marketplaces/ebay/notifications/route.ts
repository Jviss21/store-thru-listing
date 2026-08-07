import { createHash } from "crypto";
import { NextResponse } from "next/server";

/**
 * eBay Commerce Notification / Marketplace Account Deletion style challenge + ack.
 *
 * GET  — challenge verification (same SHA256 scheme as account-deletion)
 * POST — acknowledge + log payload (order/sold hooks later)
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
  const configured = process.env.EBAY_NOTIFICATIONS_ENDPOINT?.trim();
  if (configured) return configured;
  return new URL(request.url).origin + "/api/marketplaces/ebay/notifications";
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
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const topic =
    body && typeof body === "object" && "metadata" in body
      ? (body as { metadata?: { topic?: string } }).metadata?.topic
      : undefined;

  console.info("[ebay/notifications]", {
    topic: topic || "(unknown)",
    receivedAt: new Date().toISOString(),
    // signatureVerified: false — ECDSA TODO
  });

  return NextResponse.json({ ok: true, acknowledged: true });
}
