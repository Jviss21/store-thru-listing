/**
 * Mock channel publish + end-on-sale for demo completeness.
 * Live SGW/eBay keys are NOT required — stubs always succeed client-side.
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
  mode: "mock";
  message: string;
};

export type EndOnSaleResult = {
  soldListingId: string;
  ended: Array<{ id: string; channel: string }>;
  mode: "mock";
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
  const next = saveCreatedProduct({
    ...row,
    ...patch,
    tags: withStageTag(row.tags, stage),
  });
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

/**
 * Simulate publishing to SGW + eBay (or a subset). Creates Active listings
 * and advances product stage to `listed` (or `qa` if holdQa).
 */
export function mockPublishChannels(
  productId: string,
  channels: ListingChannel[] = ["ShopGoodwill", "eBay"],
  opts?: { holdQa?: boolean; price?: number }
): MockPublishResult | null {
  const product = getCreatedProducts().find((p) => p.id === productId);
  if (!product) return null;

  const status = opts?.holdQa ? "Queued" : "Active";
  const now = new Date().toISOString();
  const created: CreatedListing[] = [];

  for (const channel of channels) {
    const existing = getCreatedListings().find(
      (l) => l.productId === productId && l.channel === channel
    );
    const listing = saveCreatedListing({
      id: existing?.id ?? `lst-${channel === "eBay" ? "ebay" : "sgw"}-${productId}`,
      productId,
      channel,
      title: product.title,
      sku: product.sku,
      price: opts?.price ?? (product.price || 19.99),
      status,
      createdAt: existing?.createdAt ?? now,
    });
    created.push(listing);
  }

  const stage: WorkflowStageId = opts?.holdQa ? "qa" : product.strategy ? "listed" : "strategy";
  saveCreatedProduct({
    ...product,
    status: "Active",
    listedOn: Array.from(new Set([...product.listedOn, ...channels])),
    tags: withStageTag(product.tags, stage),
  });
  void persistStageToApi(productId, stage, withStageTag(product.tags, stage));

  const meta = sessionMeta();
  logEvent({
    section: "listings",
    action: opts?.holdQa
      ? `Mock queued on ${channels.join(" + ")}`
      : `Mock published to ${channels.join(" + ")}`,
    resource: product.sku,
    resourceHref: `/products/${encodeURIComponent(productId)}`,
    ...meta,
  });

  return {
    listings: created,
    mode: "mock",
    message: opts?.holdQa
      ? `Queued on ${channels.join(" + ")} (demo — no live API keys).`
      : `Published to ${channels.join(" + ")} (demo — no live API keys).`,
  };
}

/**
 * Mark one channel sold and end sibling listings (Delisted) — simulates end-on-sale.
 */
export function mockEndOnSale(
  productId: string,
  soldChannel: ListingChannel = "eBay"
): EndOnSaleResult | null {
  const product = getCreatedProducts().find((p) => p.id === productId);
  if (!product) return null;

  const all = getCreatedListings().filter((l) => l.productId === productId);
  let soldId = "";
  const ended: Array<{ id: string; channel: string }> = [];

  // Ensure at least the sold channel listing exists
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
      saveCreatedListing({
        id,
        productId,
        channel,
        title: product.title,
        sku: product.sku,
        price: existing?.price ?? (product.price || 19.99),
        status: "Sold",
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
      soldId = id;
    } else {
      saveCreatedListing({
        id,
        productId,
        channel,
        title: product.title,
        sku: product.sku,
        price: existing?.price ?? (product.price || 19.99),
        status: "Delisted",
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
      ended.push({ id, channel });
    }
  }

  const tags = withStageTag(
    [...(product.tags ?? []).filter((t) => !t.startsWith("ended:")), ...ended.map((e) => `ended:${e.channel}`), `soldOn:${soldChannel}`],
    "sold"
  );
  saveCreatedProduct({
    ...product,
    status: "Active",
    tags,
  });
  void persistStageToApi(productId, "sold", tags);

  const meta = sessionMeta();
  logEvent({
    section: "listings",
    action: `Sold on ${soldChannel}; ended ${ended.map((e) => e.channel).join(", ") || "no siblings"} (mock end-on-sale)`,
    resource: product.sku,
    resourceHref: `/products/${encodeURIComponent(productId)}`,
    ...meta,
  });

  return { soldListingId: soldId, ended, mode: "mock" };
}
