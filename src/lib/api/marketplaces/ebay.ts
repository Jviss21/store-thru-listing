/**
 * eBay marketplace client.
 *
 * Priority:
 * 1. Real eBay when EBAY_CLIENT_ID/SECRET/RU_NAME/ENV are set (gated; Inventory API TBD).
 * 2. Fake eBay → Hammoq Market when FAKE_EBAY_API_URL + FAKE_EBAY_API_KEY
 *    (or MARKETPLACE_CHANNEL_URL + MARKETPLACE_CHANNEL_API_KEY) are set.
 * 3. Otherwise NOT_CONFIGURED stubs (local demo still uses channel-sim).
 */

import type { ApiResult } from "@/lib/api/types";
import {
  delistOnHammoqMarket,
  fakeEbayMissingEnv,
  getHammoqMarketConfig,
  publishToHammoqMarket,
  soldOnHammoqMarket,
} from "./hammoq-market";
import type {
  MarketplaceClient,
  MarketplaceClientStatus,
  MarketplaceListingInput,
  MarketplaceListingResult,
  MarketplaceOAuthStart,
} from "./types";

const REAL_EBAY_ENV = [
  "EBAY_CLIENT_ID",
  "EBAY_CLIENT_SECRET",
  "EBAY_RU_NAME",
  "EBAY_ENV",
] as const;

function missingRealEbayEnv(): string[] {
  return REAL_EBAY_ENV.filter((key) => !process.env[key]?.trim());
}

function realEbayConfigured(): boolean {
  return missingRealEbayEnv().length === 0;
}

function fakeEbayConfigured(): boolean {
  return getHammoqMarketConfig().configured;
}

function notConfiguredReal<T>(): ApiResult<T> {
  const missing = missingRealEbayEnv();
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

async function createViaFakeEbay(
  input: MarketplaceListingInput
): Promise<ApiResult<MarketplaceListingResult>> {
  const externalId = input.externalId || input.sku || `ims-${input.orgId}-${Date.now()}`;
  const priceCents =
    typeof input.priceCents === "number" && input.priceCents > 0
      ? Math.round(input.priceCents)
      : 1999;

  const result = await publishToHammoqMarket({
    externalId,
    title: input.title,
    description: input.description || input.title,
    category: input.category || "General",
    condition: input.condition || "Used - Good",
    brand: input.brand,
    size: input.size,
    color: input.color,
    sku: input.sku,
    priceCents,
    imageUrls: input.imageUrls,
    tags: ["Fake eBay", "Buy It Now"],
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      code: result.code || "UPSTREAM_ERROR",
    };
  }

  return {
    ok: true,
    data: {
      channel: "eBay",
      externalId: result.externalId,
      status: "Published",
      url: result.absoluteUrl,
      message: `Fake eBay → Hammoq Market (${result.upserted || "ok"})`,
    },
  };
}

/**
 * Mark sold on Fake eBay (Hammoq Market /sold). Used by end-on-sale simulation.
 * Not part of MarketplaceClient — real eBay would use order webhooks later.
 */
export async function markFakeEbaySold(
  externalId: string,
  opts?: { reason?: string; orderId?: string }
): Promise<ApiResult<{ externalId: string; note?: string; conflict?: boolean }>> {
  if (realEbayConfigured()) {
    return {
      ok: false,
      error: "Real eBay is configured — sold webhook path not wired yet.",
      code: "NOT_CONFIGURED",
    };
  }
  if (!fakeEbayConfigured()) {
    return {
      ok: false,
      error: `Fake eBay not configured. Set: ${fakeEbayMissingEnv().join(", ")}`,
      code: "NOT_CONFIGURED",
    };
  }
  const result = await soldOnHammoqMarket(externalId, {
    channel: "eBay",
    reason: opts?.reason,
    orderId: opts?.orderId,
  });
  if (!result.ok) {
    return { ok: false, error: result.error, code: result.code || "UPSTREAM_ERROR" };
  }
  return {
    ok: true,
    data: {
      externalId,
      note: result.note,
      conflict: result.conflict,
    },
  };
}

export function createEbayClient(): MarketplaceClient {
  return {
    channel: "eBay",

    status(): MarketplaceClientStatus {
      if (realEbayConfigured()) {
        return {
          channel: "eBay",
          configured: true,
          missingEnv: [],
          mode: "live",
        };
      }
      if (fakeEbayConfigured()) {
        return {
          channel: "eBay",
          configured: true,
          missingEnv: [],
          mode: "fake",
        };
      }
      return {
        channel: "eBay",
        configured: false,
        missingEnv: [...missingRealEbayEnv(), ...fakeEbayMissingEnv()],
        mode: "stub",
      };
    },

    async startOAuth(orgId, redirectUri): Promise<ApiResult<MarketplaceOAuthStart>> {
      if (!realEbayConfigured()) {
        if (fakeEbayConfigured()) {
          return {
            ok: false,
            error:
              "Fake eBay (Hammoq Market) is active — no OAuth. Publish via Mock channel list / createListing.",
            code: "NOT_CONFIGURED",
          };
        }
        return notConfiguredReal();
      }
      const state = `ebay:${orgId}:${Date.now()}`;
      const clientId = process.env.EBAY_CLIENT_ID!;
      const ruName = process.env.EBAY_RU_NAME!;
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
      if (realEbayConfigured()) {
        // TODO: POST ${apiHost()}/sell/inventory/...
        return { ok: true, data: stubListing(input, "Queued") };
      }
      if (fakeEbayConfigured()) {
        return createViaFakeEbay(input);
      }
      return notConfiguredReal();
    },

    async updateListing(orgId, externalId, patch) {
      if (realEbayConfigured()) {
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
      }
      if (fakeEbayConfigured()) {
        return createViaFakeEbay({
          orgId,
          sku: patch.sku ?? externalId,
          title: patch.title ?? "Updated listing",
          description: patch.description,
          priceCents: patch.priceCents ?? 0,
          imageUrls: patch.imageUrls,
          externalId,
          category: patch.category,
          condition: patch.condition,
          brand: patch.brand,
        });
      }
      return notConfiguredReal();
    },

    async endListing(orgId, externalId) {
      void orgId;
      if (realEbayConfigured()) {
        return {
          ok: true,
          data: stubListing(
            { orgId, sku: "ended", title: "Ended", priceCents: 0 },
            "Ended",
            externalId
          ),
        };
      }
      if (fakeEbayConfigured()) {
        const result = await delistOnHammoqMarket(externalId, "Ended by IMS");
        if (!result.ok) {
          return { ok: false, error: result.error, code: result.code || "UPSTREAM_ERROR" };
        }
        const cfg = getHammoqMarketConfig();
        return {
          ok: true,
          data: {
            channel: "eBay",
            externalId,
            status: "Ended",
            url: `${cfg.baseUrl}/listing/${externalId}`,
            message: "Fake eBay delisted on Hammoq Market",
          },
        };
      }
      return notConfiguredReal();
    },

    async syncListings(orgId) {
      void orgId;
      if (realEbayConfigured() || fakeEbayConfigured()) {
        return {
          ok: true,
          data: { syncedAt: new Date().toISOString(), count: 0 },
        };
      }
      return notConfiguredReal();
    },
  };
}

