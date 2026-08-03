/**
 * eBay marketplace client stub.
 * Wire Inventory / Trading / Fulfillment when EBAY_* env vars are present.
 * Does not block local/pilot use — returns NOT_CONFIGURED without keys.
 */

import type { ApiResult } from "@/lib/api/types";
import type {
  MarketplaceClient,
  MarketplaceClientStatus,
  MarketplaceListingInput,
  MarketplaceListingResult,
  MarketplaceOAuthStart,
} from "./types";

const REQUIRED_ENV = [
  "EBAY_CLIENT_ID",
  "EBAY_CLIENT_SECRET",
  "EBAY_RU_NAME",
  "EBAY_ENV",
] as const;

function missingEnv(): string[] {
  return REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
}

function notConfigured<T>(): ApiResult<T> {
  const missing = missingEnv();
  return {
    ok: false,
    error: `eBay not configured. Set: ${missing.join(", ")}`,
    code: "NOT_CONFIGURED",
  };
}

function apiHost(): string {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.ebay.com"
    : "https://api.sandbox.ebay.com";
}

function authHost(): string {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://auth.ebay.com"
    : "https://auth.sandbox.ebay.com";
}

function stubListing(
  input: MarketplaceListingInput,
  status: MarketplaceListingResult["status"],
  externalId?: string
): MarketplaceListingResult {
  const id = externalId ?? `ebay-stub-${input.orgId}-${input.sku}`;
  return {
    channel: "eBay",
    externalId: id,
    status,
    url: `https://www.ebay.com/itm/${id}`,
    message: "Stub response — replace with eBay Inventory/Trading API.",
  };
}

export function createEbayClient(): MarketplaceClient {
  return {
    channel: "eBay",

    status(): MarketplaceClientStatus {
      const missing = missingEnv();
      return {
        channel: "eBay",
        configured: missing.length === 0,
        missingEnv: missing,
        mode: missing.length === 0 ? "live" : "stub",
      };
    },

    async startOAuth(orgId, redirectUri): Promise<ApiResult<MarketplaceOAuthStart>> {
      if (missingEnv().length) return notConfigured();
      const state = `ebay:${orgId}:${Date.now()}`;
      const clientId = process.env.EBAY_CLIENT_ID!;
      const ruName = process.env.EBAY_RU_NAME!;
      // Token + Inventory calls use apiHost() once OAuth callback is wired.
      void apiHost;
      const authorizeUrl =
        `${authHost()}/oauth2/authorize?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(ruName || redirectUri)}` +
        `&scope=${encodeURIComponent(
          [
            "https://api.ebay.com/oauth/api_scope",
            "https://api.ebay.com/oauth/api_scope/sell.inventory",
          ].join(" ")
        )}` +
        `&state=${encodeURIComponent(state)}`;
      return { ok: true, data: { channel: "eBay", authorizeUrl, state } };
    },

    async createListing(input) {
      if (missingEnv().length) return notConfigured();
      // TODO: POST ${apiHost()}/sell/inventory/...
      return { ok: true, data: stubListing(input, "Queued") };
    },

    async updateListing(orgId, externalId, patch) {
      if (missingEnv().length) return notConfigured();
      return {
        ok: true,
        data: stubListing(
          {
            orgId,
            sku: patch.sku ?? "unknown",
            title: patch.title ?? "Updated listing",
            priceCents: patch.priceCents ?? 0,
          },
          "Published",
          externalId
        ),
      };
    },

    async endListing(orgId, externalId) {
      if (missingEnv().length) return notConfigured();
      return {
        ok: true,
        data: stubListing(
          { orgId, sku: "ended", title: "Ended", priceCents: 0 },
          "Ended",
          externalId
        ),
      };
    },

    async syncListings(_orgId) {
      if (missingEnv().length) return notConfigured();
      // TODO: GET ${apiHost()}/sell/inventory/item
      return {
        ok: true,
        data: { syncedAt: new Date().toISOString(), count: 0 },
      };
    },
  };
}
