/**
 * Invite tokens: raw value goes in the URL/email once; only SHA-256 is stored.
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function newInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** Constant-time compare of two hex digests (or legacy plaintext). */
export function tokensEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Log-safe suffix only — never log full tokens or invite URLs in production. */
export function tokenLogSuffix(rawOrHash: string): string {
  if (rawOrHash.length <= 6) return "……";
  return `…${rawOrHash.slice(-6)}`;
}
