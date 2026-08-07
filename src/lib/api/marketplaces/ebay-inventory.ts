/**
 * Real eBay Sell Inventory API helpers (sandbox / production).
 *
 * Flow: merchant location → inventory item → offer → publishOffer
 * Policies: EBAY_FULFILLMENT/PAYMENT/RETURN_POLICY_ID or Account API first-available.
 */

import type { ApiResult } from "@/lib/api/types";
import type { MarketplaceListingInput, MarketplaceListingResult } from "./types";
import {
  ebayApiHost,
  getEbayUserAccessToken,
  realEbayConfigured,
  missingRealEbayEnv,
} from "./ebay-oauth";

const MARKETPLACE_ID = "EBAY_US";
const DEFAULT_LOCATION_KEY = "default";

/** Inventory API condition enums (not Trading API numeric IDs). */
const CONDITION_MAP: Record<string, string> = {
  new: "NEW",
  "new with tags": "NEW",
  "new without tags": "NEW_OTHER",
  "new other": "NEW_OTHER",
  "new with defects": "NEW_WITH_DEFECTS",
  "manufacturer refurbished": "MANUFACTURER_REFURBISHED",
  "seller refurbished": "SELLER_REFURBISHED",
  "used excellent": "USED_EXCELLENT",
  "used like new": "USED_EXCELLENT",
  "used very good": "USED_VERY_GOOD",
  "used good": "USED_GOOD",
  "used - good": "USED_GOOD",
  "used acceptable": "USED_ACCEPTABLE",
  "used - acceptable": "USED_ACCEPTABLE",
  used: "USED_GOOD",
  "for parts": "FOR_PARTS_OR_NOT_WORKING",
  "for parts or not working": "FOR_PARTS_OR_NOT_WORKING",
};

function mapCondition(raw?: string): string {
  if (!raw?.trim()) return "USED_GOOD";
  const key = raw.trim().toLowerCase();
  if (CONDITION_MAP[key]) return CONDITION_MAP[key];
  const upper = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (
    [
      "NEW",
      "NEW_OTHER",
      "NEW_WITH_DEFECTS",
      "MANUFACTURER_REFURBISHED",
      "SELLER_REFURBISHED",
      "USED_EXCELLENT",
      "USED_VERY_GOOD",
      "USED_GOOD",
      "USED_ACCEPTABLE",
      "FOR_PARTS_OR_NOT_WORKING",
    ].includes(upper)
  ) {
    return upper;
  }
  return "USED_GOOD";
}

export function formatEbayExternalId(parts: {
  offerId?: string | null;
  listingId?: string | null;
  sku?: string | null;
}): string {
  if (parts.offerId) return `offer:${parts.offerId}`;
  if (parts.listingId) return `listing:${parts.listingId}`;
  if (parts.sku) return `sku:${parts.sku}`;
  return "sku:unknown";
}

export function parseEbayExternalId(externalId: string): {
  offerId?: string;
  listingId?: string;
  sku?: string;
} {
  const id = externalId.trim();
  if (id.startsWith("offer:")) return { offerId: id.slice(6) };
  if (id.startsWith("listing:")) return { listingId: id.slice(8) };
  if (id.startsWith("sku:")) return { sku: id.slice(4) };
  // Legacy / bare ids — treat as offer id first, then sku
  if (/^\d+$/.test(id)) return { listingId: id };
  return { sku: id };
}

async function ebayFetch(
  accessToken: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const res = await fetch(`${ebayApiHost()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Language": "en-US",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json, text };
}

function ebayErrorMessage(json: unknown, fallback: string): string {
  const j = json as {
    errors?: { message?: string; longMessage?: string }[];
    error?: string;
    message?: string;
  };
  const first = j.errors?.[0];
  return (
    first?.longMessage ||
    first?.message ||
    j.message ||
    j.error ||
    fallback
  );
}

async function ensureMerchantLocation(accessToken: string): Promise<ApiResult<{ locationKey: string }>> {
  const locationKey =
    process.env.EBAY_MERCHANT_LOCATION_KEY?.trim() || DEFAULT_LOCATION_KEY;

  const get = await ebayFetch(
    accessToken,
    "GET",
    `/sell/inventory/v1/location/${encodeURIComponent(locationKey)}`
  );
  if (get.ok || get.status === 200) {
    return { ok: true, data: { locationKey } };
  }

  const postal = process.env.EBAY_MERCHANT_POSTAL_CODE?.trim() || "95125";
  const country = process.env.EBAY_MERCHANT_COUNTRY?.trim() || "US";
  const create = await ebayFetch(
    accessToken,
    "POST",
    `/sell/inventory/v1/location/${encodeURIComponent(locationKey)}`,
    {
      name: "Default warehouse",
      merchantLocationStatus: "ENABLED",
      location: {
        address: {
          postalCode: postal,
          country,
        },
      },
      locationTypes: ["WAREHOUSE"],
    }
  );
  if (!create.ok && create.status !== 204 && create.status !== 200) {
    // 409 already exists is fine
    if (create.status !== 409) {
      return {
        ok: false,
        error: ebayErrorMessage(create.json, `Failed to create merchant location (HTTP ${create.status})`),
        code: "UPSTREAM_ERROR",
      };
    }
  }
  return { ok: true, data: { locationKey } };
}

type PolicyIds = {
  fulfillmentPolicyId: string;
  paymentPolicyId: string;
  returnPolicyId: string;
};

async function resolvePolicies(accessToken: string): Promise<ApiResult<PolicyIds>> {
  const fromEnv: PolicyIds = {
    fulfillmentPolicyId: process.env.EBAY_FULFILLMENT_POLICY_ID?.trim() || "",
    paymentPolicyId: process.env.EBAY_PAYMENT_POLICY_ID?.trim() || "",
    returnPolicyId: process.env.EBAY_RETURN_POLICY_ID?.trim() || "",
  };
  if (
    fromEnv.fulfillmentPolicyId &&
    fromEnv.paymentPolicyId &&
    fromEnv.returnPolicyId
  ) {
    return { ok: true, data: fromEnv };
  }

  async function firstPolicyId(kind: "fulfillment" | "payment" | "return"): Promise<string | null> {
    const path =
      kind === "fulfillment"
        ? `/sell/account/v1/fulfillment_policy?marketplace_id=${MARKETPLACE_ID}`
        : kind === "payment"
          ? `/sell/account/v1/payment_policy?marketplace_id=${MARKETPLACE_ID}`
          : `/sell/account/v1/return_policy?marketplace_id=${MARKETPLACE_ID}`;
    const res = await ebayFetch(accessToken, "GET", path);
    if (!res.ok) return null;
    const data = res.json as {
      fulfillmentPolicies?: { fulfillmentPolicyId?: string }[];
      paymentPolicies?: { paymentPolicyId?: string }[];
      returnPolicies?: { returnPolicyId?: string }[];
    };
    if (kind === "fulfillment") {
      return data.fulfillmentPolicies?.[0]?.fulfillmentPolicyId || null;
    }
    if (kind === "payment") {
      return data.paymentPolicies?.[0]?.paymentPolicyId || null;
    }
    return data.returnPolicies?.[0]?.returnPolicyId || null;
  }

  const fulfillmentPolicyId =
    fromEnv.fulfillmentPolicyId || (await firstPolicyId("fulfillment")) || "";
  const paymentPolicyId =
    fromEnv.paymentPolicyId || (await firstPolicyId("payment")) || "";
  const returnPolicyId =
    fromEnv.returnPolicyId || (await firstPolicyId("return")) || "";

  if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
    return {
      ok: false,
      error:
        "eBay business policies missing. Set EBAY_FULFILLMENT_POLICY_ID, EBAY_PAYMENT_POLICY_ID, EBAY_RETURN_POLICY_ID or create policies in Seller Hub.",
      code: "NOT_CONFIGURED",
    };
  }
  return {
    ok: true,
    data: { fulfillmentPolicyId, paymentPolicyId, returnPolicyId },
  };
}

async function createOrReplaceInventoryItem(
  accessToken: string,
  input: MarketplaceListingInput
): Promise<ApiResult<{ sku: string }>> {
  const sku = input.sku.trim();
  const images = (input.imageUrls || []).filter((u) => /^https?:\/\//i.test(u));
  const body = {
    availability: {
      shipToLocationAvailability: {
        quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
      },
    },
    condition: mapCondition(input.condition),
    product: {
      title: input.title.slice(0, 80),
      description: (input.description || input.title).slice(0, 500000),
      aspects: {
        ...(input.brand ? { Brand: [String(input.brand)] } : {}),
        ...(input.size ? { Size: [String(input.size)] } : {}),
        ...(input.color ? { Color: [String(input.color)] } : {}),
      },
      imageUrls: images.length
        ? images.slice(0, 24)
        : [
            `https://placehold.co/800x800/2f4a35/f7faf7/png?text=${encodeURIComponent(sku.slice(0, 24))}`,
          ],
    },
  };

  const res = await ebayFetch(
    accessToken,
    "PUT",
    `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
    body
  );
  if (!res.ok && res.status !== 204) {
    return {
      ok: false,
      error: ebayErrorMessage(res.json, `createOrReplaceInventoryItem failed (HTTP ${res.status})`),
      code: "UPSTREAM_ERROR",
    };
  }
  return { ok: true, data: { sku } };
}

async function findOfferIdForSku(
  accessToken: string,
  sku: string
): Promise<string | null> {
  const res = await ebayFetch(
    accessToken,
    "GET",
    `/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}&limit=1`
  );
  if (!res.ok) return null;
  const data = res.json as { offers?: { offerId?: string }[] };
  return data.offers?.[0]?.offerId || null;
}

async function createOrUpdateOffer(
  accessToken: string,
  input: MarketplaceListingInput,
  locationKey: string,
  policies: PolicyIds,
  existingOfferId?: string | null
): Promise<ApiResult<{ offerId: string }>> {
  const sku = input.sku.trim();
  const categoryId =
    process.env.EBAY_DEFAULT_CATEGORY_ID?.trim() || "37908"; // Clothing, Shoes & Accessories > Other
  const price = (Math.max(input.priceCents, 1) / 100).toFixed(2);

  const offerBody = {
    sku,
    marketplaceId: MARKETPLACE_ID,
    format: "FIXED_PRICE",
    availableQuantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
    categoryId,
    listingDescription: (input.description || input.title).slice(0, 500000),
    listingPolicies: {
      fulfillmentPolicyId: policies.fulfillmentPolicyId,
      paymentPolicyId: policies.paymentPolicyId,
      returnPolicyId: policies.returnPolicyId,
    },
    pricingSummary: {
      price: { value: price, currency: "USD" },
    },
    merchantLocationKey: locationKey,
  };

  if (existingOfferId) {
    const upd = await ebayFetch(
      accessToken,
      "PUT",
      `/sell/inventory/v1/offer/${encodeURIComponent(existingOfferId)}`,
      offerBody
    );
    if (!upd.ok && upd.status !== 204) {
      return {
        ok: false,
        error: ebayErrorMessage(upd.json, `updateOffer failed (HTTP ${upd.status})`),
        code: "UPSTREAM_ERROR",
      };
    }
    return { ok: true, data: { offerId: existingOfferId } };
  }

  const created = await ebayFetch(accessToken, "POST", `/sell/inventory/v1/offer`, offerBody);
  if (!created.ok) {
    return {
      ok: false,
      error: ebayErrorMessage(created.json, `createOffer failed (HTTP ${created.status})`),
      code: "UPSTREAM_ERROR",
    };
  }
  const offerId = (created.json as { offerId?: string }).offerId;
  if (!offerId) {
    return { ok: false, error: "createOffer succeeded but no offerId returned", code: "UPSTREAM_ERROR" };
  }
  return { ok: true, data: { offerId } };
}

async function publishOffer(
  accessToken: string,
  offerId: string
): Promise<ApiResult<{ listingId: string }>> {
  const res = await ebayFetch(
    accessToken,
    "POST",
    `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`
  );
  if (!res.ok) {
    return {
      ok: false,
      error: ebayErrorMessage(res.json, `publishOffer failed (HTTP ${res.status})`),
      code: "UPSTREAM_ERROR",
    };
  }
  const listingId = (res.json as { listingId?: string }).listingId || "";
  return { ok: true, data: { listingId } };
}

function listingResult(
  externalId: string,
  status: MarketplaceListingResult["status"],
  listingId?: string,
  message?: string
): MarketplaceListingResult {
  return {
    channel: "eBay",
    externalId,
    status,
    url: listingId
      ? `https://www.ebay.com/itm/${listingId}`
      : undefined,
    message,
  };
}

export async function publishEbayInventoryListing(
  input: MarketplaceListingInput
): Promise<ApiResult<MarketplaceListingResult>> {
  if (!realEbayConfigured()) {
    return {
      ok: false,
      error: `eBay not configured. Set: ${missingRealEbayEnv().join(", ")}`,
      code: "NOT_CONFIGURED",
    };
  }

  const token = await getEbayUserAccessToken(input.orgId);
  if (!token.ok) return token;
  const accessToken = token.data.accessToken;

  const loc = await ensureMerchantLocation(accessToken);
  if (!loc.ok) return loc;

  const policies = await resolvePolicies(accessToken);
  if (!policies.ok) return policies;

  const item = await createOrReplaceInventoryItem(accessToken, input);
  if (!item.ok) return item;

  const existingOfferId = await findOfferIdForSku(accessToken, item.data.sku);
  const offer = await createOrUpdateOffer(
    accessToken,
    input,
    loc.data.locationKey,
    policies.data,
    existingOfferId
  );
  if (!offer.ok) return offer;

  const published = await publishOffer(accessToken, offer.data.offerId);
  if (!published.ok) return published;

  const externalId = formatEbayExternalId({
    offerId: offer.data.offerId,
    listingId: published.data.listingId,
    sku: item.data.sku,
  });

  return {
    ok: true,
    data: listingResult(
      externalId,
      "Published",
      published.data.listingId,
      "Published via eBay Inventory API"
    ),
  };
}

export async function updateEbayInventoryListing(
  orgId: string,
  externalId: string,
  patch: Partial<MarketplaceListingInput>
): Promise<ApiResult<MarketplaceListingResult>> {
  const parsed = parseEbayExternalId(externalId);
  const sku = patch.sku || parsed.sku;
  if (!sku) {
    return {
      ok: false,
      error: "SKU required to update eBay inventory listing",
      code: "BAD_REQUEST",
    };
  }
  return publishEbayInventoryListing({
    orgId,
    sku,
    title: patch.title || "Updated listing",
    description: patch.description,
    priceCents: patch.priceCents ?? 0,
    quantity: patch.quantity,
    imageUrls: patch.imageUrls,
    category: patch.category,
    condition: patch.condition,
    brand: patch.brand,
    size: patch.size,
    color: patch.color,
    externalId,
  });
}

export async function endEbayInventoryListing(
  orgId: string,
  externalId: string
): Promise<ApiResult<MarketplaceListingResult>> {
  if (!realEbayConfigured()) {
    return {
      ok: false,
      error: `eBay not configured. Set: ${missingRealEbayEnv().join(", ")}`,
      code: "NOT_CONFIGURED",
    };
  }

  const token = await getEbayUserAccessToken(orgId);
  if (!token.ok) return token;
  const accessToken = token.data.accessToken;

  const parsed = parseEbayExternalId(externalId);
  let offerId = parsed.offerId || null;

  if (!offerId && parsed.sku) {
    offerId = await findOfferIdForSku(accessToken, parsed.sku);
  }

  if (offerId) {
    const withdraw = await ebayFetch(
      accessToken,
      "POST",
      `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/withdraw`
    );
    // Ignore already-withdrawn
    if (!withdraw.ok && withdraw.status !== 404) {
      // still try delete
    }
    const del = await ebayFetch(
      accessToken,
      "DELETE",
      `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`
    );
    if (!del.ok && del.status !== 204 && del.status !== 404) {
      return {
        ok: false,
        error: ebayErrorMessage(del.json, `deleteOffer failed (HTTP ${del.status})`),
        code: "UPSTREAM_ERROR",
      };
    }
  } else if (parsed.sku) {
    const delItem = await ebayFetch(
      accessToken,
      "DELETE",
      `/sell/inventory/v1/inventory_item/${encodeURIComponent(parsed.sku)}`
    );
    if (!delItem.ok && delItem.status !== 204 && delItem.status !== 404) {
      return {
        ok: false,
        error: ebayErrorMessage(delItem.json, `deleteInventoryItem failed (HTTP ${delItem.status})`),
        code: "UPSTREAM_ERROR",
      };
    }
  } else {
    return {
      ok: false,
      error: "Cannot end listing — no offerId or sku in externalId",
      code: "BAD_REQUEST",
    };
  }

  return {
    ok: true,
    data: listingResult(
      formatEbayExternalId({
        offerId: offerId || undefined,
        listingId: parsed.listingId,
        sku: parsed.sku,
      }),
      "Ended",
      parsed.listingId,
      "Ended via eBay Inventory API (withdraw/delete)"
    ),
  };
}
