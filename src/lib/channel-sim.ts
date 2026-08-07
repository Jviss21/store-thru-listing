/**
 * Mock channel publish + end-on-sale for demo completeness.
 * When Fake eBay env is configured, eBay publish/sold also hits Hammoq Market.
 * Live SGW/eBay vendor keys are NOT required for the local listing rows.
 */

import {
  getCreatedListings,
  getCreatedProducts,
  saveCreatedListing,
  saveCreatedProduct,
  type CreatedListing,
} from "@/lib/demo-actions";
import { logEvent } from "@/lib/event-log";
import { loadSession } from "@/lib/session";
import type { ListingChannel } from "@/lib/types";
import { withStageTag, type WorkflowStageId } from "@/lib/workflow";

export type MockPublishResult = {
  listings: CreatedListing[];
  mode: "mock" | "fake-ebay";
  message: string;
  marketUrl?: string;
};

export type EndOnSaleResult = {
  soldListingId: string;
  ended: Array<{ id: string; channel: string }>;
  mode: "mock" | "fake-ebay";
  marketNote?: string;
};

function sessionMeta() {
  const session = loadSession();
  return {
    user: session.handle || undefined,
    userName: session.name || undefined,
    orgId: session.activeOrgId,
  };
}

/** Persist pipeline stage on product tags (+ best-effort Postgres PATCH). */
export function advanceProductStage(
  productId: string,
  stage: WorkflowStageId,
  patch?: Partial<{ location: string; status: "Draft" | "Active"; imageUrls: string[] }>
) {
  const row = getCreatedProducts().find((p) => p.id === productId);
  if (!row) return null;
  const next = saveCreatedProduct(
    {
      ...row,
      ...patch,
      tags: withStageTag(row.tags, stage),
    },
    { skipEvent: true }
  );
  void persistStageToApi(productId, stage, next.tags ?? []);
  return next;
}

async function persistStageToApi(productId: string, stage: WorkflowStageId, tags: string[]) {
  try {
    await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags, stage }),
    });
  } catch {
    /* demo localStorage is source of truth when API/DB unavailable */
  }
}

async function pushFakeEbay(product: {
  id: string;
  sku: string;
  title: string;
  description?: string;
  price: number;
  category?: string;
  condition?: string;
  brand?: string;
  imageUrls?: string[];
}, priceOverride?: number): Promise<{ ok: boolean; message: string; url?: string; mode: "fake-ebay" | "mock" }> {
  try {
    const res = await fetch("/api/marketplaces/ebay/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        sku: product.sku,
        title: product.title,
        description: product.description || product.title,
        price: priceOverride ?? product.price ?? 19.99,
        category: product.category || "General",
        condition: product.condition || "Used - Good",
        brand: product.brand,
        imageUrls: product.imageUrls,
      }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      code?: string;
      data?: { url?: string; message?: string; externalId?: string };
    };
    if (json.ok && json.data) {
      return {
        ok: true,
        message: json.data.message || "Pushed to Hammoq Market (Fake eBay).",
        url: json.data.url,
        mode: "fake-ebay",
      };
    }
    if (json.code === "NOT_CONFIGURED") {
      return {
        ok: false,
        message: "Hammoq Market not configured — local eBay mock only.",
        mode: "mock",
      };
    }
    return {
      ok: false,
      message: `Fake eBay push failed: ${json.error || res.statusText}`,
      mode: "mock",
    };
  } catch {
    return {
      ok: false,
      message: "Fake eBay push unreachable — local eBay mock only.",
      mode: "mock",
    };
  }
}

async function notifyFakeEbaySold(productId: string, sku: string): Promise<string | undefined> {
  try {
    const res = await fetch("/api/marketplaces/ebay/sold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        sku,
        reason: "Sold on eBay (IMS simulate sold)",
      }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      code?: string;
      data?: { note?: string; conflict?: boolean };
    };
    if (json.ok) {
      if (json.data?.conflict) return json.data.note || "Market sale conflict";
      return json.data?.note || "Removed from Hammoq Market (sold).";
    }
    if (json.code === "NOT_CONFIGURED") return undefined;
    return `Market sold notify failed: ${json.error || res.statusText}`;
  } catch {
    return "Market sold notify unreachable";
  }
}

/**
 * Simulate publishing to SGW + eBay (or a subset). Creates Active listings
 * and advances product stage to `listed` (or `qa` if holdQa).
 * When Fake eBay is configured, also POSTs the eBay channel item to Hammoq Market.
 */
export async function mockPublishChannels(
  productId: string,
  channels: ListingChannel[] = ["ShopGoodwill", "eBay"],
  opts?: { holdQa?: boolean; price?: number }
): Promise<MockPublishResult | null> {
  const product = getCreatedProducts().find((p) => p.id === productId);
  if (!product) return null;

  const status = opts?.holdQa ? "Queued" : "Active";
  const now = new Date().toISOString();
  const created: CreatedListing[] = [];

  for (const channel of channels) {
    const existing = getCreatedListings().find(
      (l) => l.productId === productId && l.channel === channel
    );
    const listing = saveCreatedListing(
      {
        id: existing?.id ?? `lst-${channel === "eBay" ? "ebay" : "sgw"}-${productId}`,
        productId,
        channel,
        title: product.title,
        sku: product.sku,
        price: opts?.price ?? (product.price || 19.99),
        status,
        createdAt: existing?.createdAt ?? now,
      },
      { skipEvent: true }
    );
    created.push(listing);
  }

  const stage: WorkflowStageId = opts?.holdQa ? "qa" : product.strategy ? "listed" : "strategy";
  saveCreatedProduct(
    {
      ...product,
      status: "Active",
      listedOn: Array.from(new Set([...product.listedOn, ...channels])),
      tags: withStageTag(product.tags, stage),
    },
    { skipEvent: true }
  );
  void persistStageToApi(productId, stage, withStageTag(product.tags, stage));

  let marketUrl: string | undefined;
  let marketNote = "";
  let mode: MockPublishResult["mode"] = "mock";

  if (channels.includes("eBay") && !opts?.holdQa) {
    const push = await pushFakeEbay(product, opts?.price);
    marketNote = ` ${push.message}`;
    marketUrl = push.url;
    if (push.mode === "fake-ebay" && push.ok) mode = "fake-ebay";
  }

  const meta = sessionMeta();
  logEvent({
    section: "listings",
    action: opts?.holdQa
      ? `Mock queued on ${channels.join(" + ")}`
      : mode === "fake-ebay"
        ? `Published to ${channels.join(" + ")} (Fake eBay)`
        : `Mock published to ${channels.join(" + ")}`,
    resource: product.sku,
    resourceHref: `/products/${encodeURIComponent(productId)}`,
    entityId: productId,
    detail: marketNote.trim() || (opts?.holdQa ? "Additional QA hold" : undefined),
    ...meta,
  });

  return {
    listings: created,
    mode,
    marketUrl,
    message: opts?.holdQa
      ? `Queued on ${channels.join(" + ")} (demo — no live API keys).`
      : `Published to ${channels.join(" + ")}.${marketNote}`,
  };
}

/**
 * Mark one channel sold and end sibling listings (Delisted) — simulates end-on-sale.
 * When Fake eBay is configured and sold channel is eBay, notifies Hammoq Market /sold.
 */
export async function mockEndOnSale(
  productId: string,
  soldChannel: ListingChannel = "eBay"
): Promise<EndOnSaleResult | null> {
  const product = getCreatedProducts().find((p) => p.id === productId);
  if (!product) return null;

  const all = getCreatedListings().filter((l) => l.productId === productId);
  let soldId = "";
  const ended: Array<{ id: string; channel: string }> = [];

  const channels: ListingChannel[] =
    all.length > 0
      ? (Array.from(new Set(all.map((l) => l.channel))) as ListingChannel[])
      : product.listedOn.length
        ? (product.listedOn as ListingChannel[])
        : ["ShopGoodwill", "eBay"];

  for (const channel of channels) {
    const existing = all.find((l) => l.channel === channel);
    const id = existing?.id ?? `lst-${channel === "eBay" ? "ebay" : "sgw"}-${productId}`;
    if (channel === soldChannel) {
      saveCreatedListing(
        {
          id,
          productId,
          channel,
          title: product.title,
          sku: product.sku,
          price: existing?.price ?? (product.price || 19.99),
          status: "Sold",
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        },
        { skipEvent: true }
      );
      soldId = id;
    } else {
      saveCreatedListing(
        {
          id,
          productId,
          channel,
          title: product.title,
          sku: product.sku,
          price: existing?.price ?? (product.price || 19.99),
          status: "Delisted",
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        },
        { skipEvent: true }
      );
      ended.push({ id, channel });
    }
  }

  const tags = withStageTag(
    [...(product.tags ?? []).filter((t) => !t.startsWith("ended:")), ...ended.map((e) => `ended:${e.channel}`), `soldOn:${soldChannel}`],
    "sold"
  );
  saveCreatedProduct(
    {
      ...product,
      status: "Active",
      tags,
    },
    { skipEvent: true }
  );
  void persistStageToApi(productId, "sold", tags);

  let marketNote: string | undefined;
  let mode: EndOnSaleResult["mode"] = "mock";
  if (soldChannel === "eBay") {
    marketNote = await notifyFakeEbaySold(productId, product.sku);
    if (marketNote && !marketNote.includes("failed") && !marketNote.includes("unreachable")) {
      mode = "fake-ebay";
    }
  }

  const meta = sessionMeta();
  logEvent({
    section: "listings",
    action: `Sold on ${soldChannel}; ended ${ended.map((e) => e.channel).join(", ") || "no siblings"} (mock end-on-sale)`,
    resource: product.sku,
    resourceHref: `/products/${encodeURIComponent(productId)}`,
    entityId: productId,
    detail: marketNote || (mode === "fake-ebay" ? "Fake eBay notified" : undefined),
    ...meta,
  });

  return { soldListingId: soldId, ended, mode, marketNote };
}
