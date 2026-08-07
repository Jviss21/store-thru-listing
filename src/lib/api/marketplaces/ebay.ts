/**
 * eBay marketplace client.
 *
 * Priority:
 * 1. Real eBay Inventory API when EBAY_CLIENT_ID/SECRET/RU_NAME/ENV are set.
 * 2. Fake eBay ? Hammoq Market when FAKE_EBAY_API_URL + FAKE_EBAY_API_KEY
 *    (or MARKETPLACE_CHANNEL_URL + MARKETPLACE_CHANNEL_API_KEY) are set.
 * 3. Otherwise NOT_CONFIGURED stubs (local demo still uses channel-sim).
 */

import type { ApiResult } from "@/lib/api/types";
import {
  endEbayInventoryListing,
  publishEbayInventoryListing,
  updateEbayInventoryListing,
} from "./ebay-inventory";
import {
  buildEbayAuthorizeUrl,
  missingRealEbayEnv,
  realEbayConfigured,
} from "./ebay-oauth";
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
    message: "Stub response ? eBay Inventory not reachable.",
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
      message: `Fake eBay ? Hammoq Market (${result.upserted || "ok"})`,
    },
  };
}

/**
 * Mark sold on Fake eBay (Hammoq Market /sold). Used by end-on-sale simulation.
 * Not part of MarketplaceClient ? real eBay would use order webhooks later.
 */
export async function markFakeEbaySold(
  externalId: string,
  opts?: { reason?: string; orderId?: string }
): Promise<ApiResult<{ externalId: string; note?: string; conflict?: boolean }>> {
  if (realEbayConfigured()) {
    return {
      ok: false,
      error: "Real eBay is configured ? sold webhook path not wired yet.",
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
              "Fake eBay (Hammoq Market) is active ? no OAuth. Publish via Mock channel list / createListing.",
            code: "NOT_CONFIGURED",
          };
        }
        return notConfiguredReal();
      }
      const built = buildEbayAuthorizeUrl({ orgId, redirectUri });
      if (!built.ok) return built;
      return {
        ok: true,
        data: {
          channel: "eBay",
          authorizeUrl: built.data.authorizeUrl,
          state: built.data.state,
        },
      };
    },

    async createListing(input) {
      if (realEbayConfigured()) {
        return publishEbayInventoryListing(input);
      }
      if (fakeEbayConfigured()) {
        return createViaFakeEbay(input);
      }
      return notConfiguredReal();
    },

    async updateListing(orgId, externalId, patch) {
      if (realEbayConfigured()) {
        return updateEbayInventoryListing(orgId, externalId, patch);
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
      if (realEbayConfigured()) {
        return endEbayInventoryListing(orgId, externalId);
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
      void stubListing;
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
