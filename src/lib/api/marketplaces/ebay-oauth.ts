/**
 * Real eBay OAuth (user tokens) + refresh-token persistence.
 *
 * Required env: EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_RU_NAME, EBAY_ENV
 * Optional: EBAY_USER_REFRESH_TOKEN (dev fallback when no org DB token)
 */

import type { ApiResult } from "@/lib/api/types";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secrets";
import { prisma, isDbReady } from "@/lib/db/client";

export const EBAY_OAUTH_SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
] as const;

const REAL_EBAY_ENV = [
  "EBAY_CLIENT_ID",
  "EBAY_CLIENT_SECRET",
  "EBAY_RU_NAME",
  "EBAY_ENV",
] as const;

export function missingRealEbayEnv(): string[] {
  return REAL_EBAY_ENV.filter((key) => !process.env[key]?.trim());
}

export function realEbayConfigured(): boolean {
  return missingRealEbayEnv().length === 0;
}

export function ebayApiHost(): string {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.ebay.com"
    : "https://api.sandbox.ebay.com";
}

export function ebayAuthHost(): string {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://auth.ebay.com"
    : "https://auth.sandbox.ebay.com";
}

function basicAuthHeader(): string {
  const id = process.env.EBAY_CLIENT_ID!.trim();
  const secret = process.env.EBAY_CLIENT_SECRET!.trim();
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

export type EbayTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type?: string;
};

async function parseTokenResponse(res: Response): Promise<ApiResult<EbayTokenResponse>> {
  const body = (await res.json().catch(() => ({}))) as EbayTokenResponse & {
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !body.access_token) {
    return {
      ok: false,
      error:
        body.error_description ||
        body.error ||
        `eBay token exchange failed (HTTP ${res.status})`,
      code: "UPSTREAM_ERROR",
    };
  }
  return { ok: true, data: body };
}

/** Exchange authorization code for access + refresh tokens. */
export async function exchangeEbayAuthCode(
  code: string
): Promise<ApiResult<EbayTokenResponse>> {
  if (!realEbayConfigured()) {
    return {
      ok: false,
      error: `eBay not configured. Set: ${missingRealEbayEnv().join(", ")}`,
      code: "NOT_CONFIGURED",
    };
  }
  const ruName = process.env.EBAY_RU_NAME!.trim();
  const res = await fetch(`${ebayApiHost()}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: ruName,
    }).toString(),
  });
  return parseTokenResponse(res);
}

/** Refresh a user access token from a refresh token. */
export async function refreshEbayAccessToken(
  refreshToken: string
): Promise<ApiResult<EbayTokenResponse>> {
  if (!realEbayConfigured()) {
    return {
      ok: false,
      error: `eBay not configured. Set: ${missingRealEbayEnv().join(", ")}`,
      code: "NOT_CONFIGURED",
    };
  }
  const res = await fetch(`${ebayApiHost()}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: EBAY_OAUTH_SCOPES.join(" "),
    }).toString(),
  });
  return parseTokenResponse(res);
}

/**
 * Resolve a user access token for Inventory/Account APIs.
 * Prefer org DB refresh token; fall back to EBAY_USER_REFRESH_TOKEN.
 */
export async function getEbayUserAccessToken(
  orgId: string
): Promise<ApiResult<{ accessToken: string; source: "db" | "env" }>> {
  if (!realEbayConfigured()) {
    return {
      ok: false,
      error: `eBay not configured. Set: ${missingRealEbayEnv().join(", ")}`,
      code: "NOT_CONFIGURED",
    };
  }

  const fromDb = await loadEbayRefreshToken(orgId);
  const envRefresh = process.env.EBAY_USER_REFRESH_TOKEN?.trim() || "";
  const refreshToken = fromDb || envRefresh;
  if (!refreshToken) {
    return {
      ok: false,
      error:
        "No eBay user refresh token. Connect eBay OAuth or set EBAY_USER_REFRESH_TOKEN.",
      code: "NOT_CONFIGURED",
    };
  }

  const refreshed = await refreshEbayAccessToken(refreshToken);
  if (!refreshed.ok) return refreshed;

  // Persist rotated refresh token when eBay returns a new one
  if (refreshed.data.refresh_token && fromDb) {
    await storeEbayRefreshToken(orgId, refreshed.data.refresh_token);
  }

  return {
    ok: true,
    data: {
      accessToken: refreshed.data.access_token,
      source: fromDb ? "db" : "env",
    },
  };
}

export async function storeEbayRefreshToken(
  orgId: string,
  refreshToken: string,
  opts?: { accountId?: string; accountName?: string }
): Promise<ApiResult<{ stored: true }>> {
  if (!isDbReady() || !prisma) {
    return {
      ok: false,
      error: "Database not ready — cannot store eBay refresh token.",
      code: "NOT_CONFIGURED",
    };
  }
  const enc = encryptSecret(refreshToken);
  await prisma.marketplaceConnection.upsert({
    where: { orgId_channel: { orgId, channel: "eBay" } },
    create: {
      orgId,
      channel: "eBay",
      status: "Connected",
      syncEnabled: true,
      oauthRefreshTokenEnc: enc,
      accountId: opts?.accountId ?? null,
      accountName: opts?.accountName ?? "eBay",
      notes: "eBay OAuth connected",
      lastSyncAt: new Date(),
    },
    update: {
      status: "Connected",
      syncEnabled: true,
      oauthRefreshTokenEnc: enc,
      accountId: opts?.accountId ?? undefined,
      accountName: opts?.accountName ?? undefined,
      notes: "eBay OAuth connected",
      lastSyncAt: new Date(),
    },
  });
  return { ok: true, data: { stored: true } };
}

export async function loadEbayRefreshToken(orgId: string): Promise<string | null> {
  if (!isDbReady() || !prisma) return null;
  const row = await prisma.marketplaceConnection.findUnique({
    where: { orgId_channel: { orgId, channel: "eBay" } },
    select: { oauthRefreshTokenEnc: true },
  });
  if (!row?.oauthRefreshTokenEnc) return null;
  try {
    return decryptSecret(row.oauthRefreshTokenEnc);
  } catch {
    return null;
  }
}

/** Best-effort wipe of tokens when eBay account-deletion notifies us. */
export async function clearEbayConnectionsByAccountId(
  accountId: string
): Promise<{ cleared: number }> {
  if (!isDbReady() || !prisma || !accountId.trim()) {
    return { cleared: 0 };
  }
  const result = await prisma.marketplaceConnection.updateMany({
    where: { channel: "eBay", accountId: accountId.trim() },
    data: {
      oauthRefreshTokenEnc: null,
      status: "Not connected",
      syncEnabled: false,
      notes: "Cleared via eBay account deletion notification",
    },
  });
  return { cleared: result.count };
}

export function buildEbayAuthorizeUrl(opts: {
  orgId: string;
  redirectUri?: string;
  state?: string;
}): ApiResult<{ authorizeUrl: string; state: string }> {
  if (!realEbayConfigured()) {
    return {
      ok: false,
      error: `eBay not configured. Set: ${missingRealEbayEnv().join(", ")}`,
      code: "NOT_CONFIGURED",
    };
  }
  const clientId = process.env.EBAY_CLIENT_ID!.trim();
  const ruName = process.env.EBAY_RU_NAME!.trim();
  const state = opts.state || `ebay:${opts.orgId}:${Date.now()}`;
  const authorizeUrl =
    `${ebayAuthHost()}/oauth2/authorize?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(ruName || opts.redirectUri || "")}` +
    `&scope=${encodeURIComponent(EBAY_OAUTH_SCOPES.join(" "))}` +
    `&state=${encodeURIComponent(state)}`;
  return { ok: true, data: { authorizeUrl, state } };
}
