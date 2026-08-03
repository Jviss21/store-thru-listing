/**
 * ShopGoodwill marketplace client stub.
 * Wire real OAuth + listing APIs when SHOPGOODWILL_* env vars are present.
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
  "SHOPGOODWILL_CLIENT_ID",
  "SHOPGOODWILL_CLIENT_SECRET",
  "SHOPGOODWILL_API_BASE_URL",
] as const;

function missingEnv(): string[] {
  return REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
}

function notConfigured<T>(): ApiResult<T> {
  const missing = missingEnv();
  return {
    ok: false,
    error: `ShopGoodwill not configured. Set: ${missing.join(", ")}`,
    code: "NOT_CONFIGURED",
  };
}

function stubListing(
  input: MarketplaceListingInput,
  status: MarketplaceListingResult["status"],
  externalId?: string
): MarketplaceListingResult {
  const id = externalId ?? `sgw-stub-${input.orgId}-${input.sku}`;
  return {
    channel: "ShopGoodwill",
    externalId: id,
    status,
    url: `https://shopgoodwill.com/item/${id}`,
    message: "Stub response — replace with ShopGoodwill listing API.",
  };
}

export function createShopGoodwillClient(): MarketplaceClient {
  return {
    channel: "ShopGoodwill",

    status(): MarketplaceClientStatus {
      const missing = missingEnv();
      return {
        channel: "ShopGoodwill",
        configured: missing.length === 0,
        missingEnv: missing,
        mode: missing.length === 0 ? "live" : "stub",
      };
    },

    async startOAuth(orgId, redirectUri): Promise<ApiResult<MarketplaceOAuthStart>> {
      if (missingEnv().length) return notConfigured();
      const state = `sgw:${orgId}:${Date.now()}`;
      const base = process.env.SHOPGOODWILL_API_BASE_URL!.replace(/\/$/, "");
      const clientId = process.env.SHOPGOODWILL_CLIENT_ID!;
      const authorizeUrl =
        `${base}/oauth/authorize?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}`;
      return { ok: true, data: { channel: "ShopGoodwill", authorizeUrl, state } };
    },

    async createListing(input) {
      if (missingEnv().length) return notConfigured();
      // TODO: POST to ShopGoodwill listing create endpoint
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
      return {
        ok: true,
        data: { syncedAt: new Date().toISOString(), count: 0 },
      };
    },
  };
}
