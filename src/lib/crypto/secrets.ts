/**
 * AES-256-GCM helpers for storing OAuth refresh tokens at rest.
 * Key derived from NEXTAUTH_SECRET (or DEMO_PASSWORD / dev fallback).
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function keyFromSecret(): Buffer {
  const secret =
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.DEMO_PASSWORD?.trim() ||
    "stl-pilot-dev-secret";
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromSecret(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unsupported secret payload format");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", keyFromSecret(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
