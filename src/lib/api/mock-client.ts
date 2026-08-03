/**
 * Mock API client — wires existing mock-data behind org-scoped adapters.
 * Swap createApiClient() later to return an HttpApiClient without UI changes.
 */

import {
  autoListQueue,
  listings as baseListings,
  orders as baseOrders,
  products as baseProducts,
  shipments as baseShipments,
  BRAND,
} from "@/lib/mock-data";
import {
  DEFAULT_ORG_ID,
  PILOT_ORGS,
  getOrgById,
  orgIndex,
  type OrgFeatureFlags,
} from "@/lib/orgs";
import type {
  ApiClient,
  ApiResult,
  AutoListQueueItem,
  MarketplaceConnectionState,
  OrgHealth,
  SyncError,
} from "./types";
import type { Listing, Product } from "@/lib/types";

const CONNECTIONS_KEY = "stl-connections-v1";
const OPS_STATE_KEY = "stl-ops-state-v1";
const LISTING_OVERRIDES_KEY = "stl-listing-overrides-v1";

type OpsPersisted = {
  byOrg: Record<
    string,
    {
      syncStatus?: OrgHealth["syncStatus"];
      errorCount?: number;
      autoListVolumeToday?: number;
      lastForceSyncAt?: string | null;
      flags?: Partial<OrgFeatureFlags>;
    }
  >;
};

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail<T = never>(error: string, code?: string): ApiResult<T> {
  return { ok: false, error, code };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function skuPrefix(orgId: string): string {
  const org = getOrgById(orgId);
  if (!org) return "ORG";
  return org.slug
    .split("-")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4) || "ORG";
}

/** Light per-org dataset: retag SKUs / titles / locations; keep structure. */
function scopeProducts(orgId: string): Product[] {
  const idx = orgIndex(orgId);
  const prefix = skuPrefix(orgId);
  const org = getOrgById(orgId);
  return baseProducts.map((p, i) => {
    // Slightly different slice size per org for variety
    const keep = i % (10 + (idx % 3)) !== 0 || orgId === DEFAULT_ORG_ID;
    if (!keep && i > 40) return null;
    return {
      ...p,
      id: `${orgId}-${p.id}`,
      sku: `${prefix}${p.sku.replace(/^[A-Z]+/, "")}`,
      title: orgId === DEFAULT_ORG_ID ? p.title : `${p.title.replace(/· Lot \d+/, "")} · ${org?.name.split(" ")[0] ?? "Org"}`,
      description: p.description?.replace(/Test Goodwill/g, org?.name ?? "Org"),
      privateDescription: `${prefix}-${p.privateDescription ?? p.sku}`,
      tags: [...(p.tags ?? []), `org:${orgId}`],
    };
  }).filter(Boolean) as Product[];
}

function loadListingOverrides(): Record<string, Partial<Listing>> {
  return readJson<Record<string, Partial<Listing>>>(LISTING_OVERRIDES_KEY, {});
}
function saveListingOverride(id: string, patch: Partial<Listing>) {
  const all = loadListingOverrides();
  all[id] = { ...all[id], ...patch, id };
  writeJson(LISTING_OVERRIDES_KEY, all);
}
function scopeListings(orgId: string): Listing[] {
  const products = scopeProducts(orgId);
  const productIds = new Set(products.map((p) => p.id));
  const org = getOrgById(orgId);
  const idx = orgIndex(orgId);
  const prefix = skuPrefix(orgId);
  const overrides = loadListingOverrides();
  const rows = baseListings
    .map((l) => {
      const scopedProductId = `${orgId}-${l.productId}`;
      if (!productIds.has(scopedProductId)) return null;
      const numericId = parseInt(l.id.slice(1), 10) || 0;
      const forceQa =
        numericId % (17 + idx) === 0 ||
        numericId === 3 + idx ||
        numericId === 11 + idx;
      const status = forceQa ? ("Additional QA Required" as const) : l.status;
      const scopedId = `${orgId}-${l.id}`;
      const override = overrides[scopedId];
      return {
        ...l,
        sku: `${prefix}${l.sku.replace(/^[A-Z]+/, "")}`,
        status,
        tags: [...l.tags, `org:${orgId}`],
        itemLocation: `${org?.name ?? "Org"} · Anonymized Demo Facility, USA`,
        description: l.description.replace(/Test Goodwill/g, org?.name ?? "Org"),
        privateDescription: `${prefix}-${l.privateDescription}`,
        ...override,
        id: scopedId,
        productId: scopedProductId,
      } satisfies Listing;
    })
    .filter(Boolean) as Listing[];
  let qaCount = rows.filter((r) => r.status === "Additional QA Required").length;
  for (let i = 0; i < rows.length && qaCount < 3; i++) {
    if (rows[i]!.status !== "Additional QA Required") {
      rows[i] = { ...rows[i]!, status: "Additional QA Required" };
      qaCount += 1;
    }
  }
  return rows;
}

function defaultConnections(orgId: string): MarketplaceConnectionState[] {
  const org = getOrgById(orgId);
  const name = org?.name ?? "Org";
  const flags = org?.flags;
  return [
    {
      id: `${orgId}-conn-sgw`,
      channel: "ShopGoodwill",
      accountId: `${org?.slug ?? "org"}_sgw`,
      accountName: `${name} — ShopGoodwill`,
      status: flags?.shopgoodwill === false ? "Not connected" : "Connected",
      syncEnabled: flags?.shopgoodwill !== false,
      lastSyncAt: flags?.shopgoodwill === false ? null : new Date(Date.now() - 18 * 60000).toISOString(),
      notes: "Primary auction channel. Failed listings route to Additional QA Required.",
    },
    {
      id: `${orgId}-conn-ebay`,
      channel: "eBay",
      accountId: `${org?.slug ?? "org"}-ebay`,
      accountName: `${name} eBay Store`,
      status: flags?.ebay === false ? "Not connected" : "Connected",
      syncEnabled: flags?.ebay !== false,
      lastSyncAt: flags?.ebay === false ? null : new Date(Date.now() - 42 * 60000).toISOString(),
      notes: "Fixed-price preferred. Policies managed in Listing defaults.",
    },
  ];
}

function loadConnections(orgId: string): MarketplaceConnectionState[] {
  const all = readJson<Record<string, MarketplaceConnectionState[]>>(CONNECTIONS_KEY, {});
  if (all[orgId]?.length) return all[orgId]!;
  return defaultConnections(orgId);
}

function saveConnections(orgId: string, connections: MarketplaceConnectionState[]) {
  const all = readJson<Record<string, MarketplaceConnectionState[]>>(CONNECTIONS_KEY, {});
  all[orgId] = connections;
  writeJson(CONNECTIONS_KEY, all);
}

function seedErrors(orgId: string): SyncError[] {
  const org = getOrgById(orgId);
  const count = Math.max(3, Math.min(8, org?.seedErrorCount ?? 3));
  const channels: Array<SyncError["channel"]> = ["ShopGoodwill", "eBay", "eBay", "ShopGoodwill", "System"];
  const messages = [
    "Category mapping rejected by channel — held in Additional QA Required",
    "Title length exceeds marketplace limit after AI suggestion",
    "Photo set incomplete (min 3 required) — sync aborted",
    "OAuth token refresh failed — reconnect marketplace",
    "Price below org floor — Auto-List blocked",
    "UPC conflict with existing live listing",
    "Rate limit from channel API — retry scheduled",
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `${orgId}-err-${i + 1}`,
    orgId,
    channel: channels[i % channels.length]!,
    listingId: `${orgId}-l${i + 3}`,
    sku: `${skuPrefix(orgId)}${(610001 + i).toString(36).toUpperCase()}`,
    title: `Sync failure sample ${i + 1}`,
    message: messages[i % messages.length]!,
    at: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    severity: i % 4 === 0 ? "warning" : "error",
  }));
}

function loadOps(): OpsPersisted {
  return readJson<OpsPersisted>(OPS_STATE_KEY, { byOrg: {} });
}

function saveOps(state: OpsPersisted) {
  writeJson(OPS_STATE_KEY, state);
}

function buildHealth(orgId: string): OrgHealth {
  const org = getOrgById(orgId)!;
  const persisted = loadOps().byOrg[orgId] ?? {};
  const flags: OrgFeatureFlags = {
    ...org.flags,
    ...persisted.flags,
  };
  const syncStatus =
    !flags.killSwitchOff
      ? "paused"
      : persisted.syncStatus ?? org.seedSyncStatus;
  return {
    orgId,
    syncStatus,
    errorCount: persisted.errorCount ?? org.seedErrorCount,
    autoListVolumeToday: !flags.autoList || !flags.killSwitchOff
      ? 0
      : persisted.autoListVolumeToday ?? org.seedAutoListVolume,
    lastForceSyncAt: persisted.lastForceSyncAt ?? null,
    flags,
    recentErrors: seedErrors(orgId).slice(0, 8),
  };
}

export function createMockApiClient(): ApiClient {
  return {
    orgs: {
      async list() {
        return ok(PILOT_ORGS);
      },
      async get(orgId) {
        return ok(getOrgById(orgId) ?? null);
      },
    },
    products: {
      async list(orgId) {
        return ok(scopeProducts(orgId));
      },
      async get(orgId, id) {
        const all = scopeProducts(orgId);
        return ok(all.find((p) => p.id === id || p.sku === id) ?? null);
      },
    },
    listings: {
      async list(orgId, channel) {
        let rows = scopeListings(orgId);
        if (channel) rows = rows.filter((l) => l.channel === channel);
        return ok(rows);
      },
      async get(orgId, id) {
        const all = scopeListings(orgId);
        const found =
          all.find((l) => l.id === id) ??
          all.find((l) => l.id.endsWith(`-${id}`)) ??
          all.find((l) => l.id === `${orgId}-${id}`);
        return ok(found ?? null);
      },
      async update(orgId, id, patch) {
        const all = scopeListings(orgId);
        const current =
          all.find((l) => l.id === id) ??
          all.find((l) => l.id.endsWith(`-${id}`)) ??
          all.find((l) => l.id === `${orgId}-${id}`);
        if (!current) return fail("Listing not found", "NOT_FOUND");
        const next: Listing = { ...current, ...patch, id: current.id, productId: current.productId };
        saveListingOverride(current.id, next);
        return ok(next);
      },
    },
    autoList: {
      async queue(orgId) {
        const health = buildHealth(orgId);
        if (!health.flags.killSwitchOff || !health.flags.autoList) {
          return ok([]);
        }
        const idx = orgIndex(orgId);
        const items: AutoListQueueItem[] = autoListQueue
          .slice(0, Math.max(8, 24 - idx * 2))
          .map((r) => ({
            ...r,
            id: `${orgId}-${r.id}`,
            productId: `${orgId}-${r.productId}`,
            sku: `${skuPrefix(orgId)}${r.sku.replace(/^[A-Z]+/, "")}`,
            orgId,
          }));
        return ok(items);
      },
    },
    orders: {
      async list(orgId) {
        const idx = orgIndex(orgId);
        return ok(
          baseOrders.slice(0, Math.max(20, 80 - idx * 5)).map((o) => ({
            ...o,
            id: `${orgId}-${o.id}`,
            orderNumber: `${skuPrefix(orgId)}-${o.orderNumber}`,
          }))
        );
      },
    },
    shipments: {
      async list(orgId) {
        const idx = orgIndex(orgId);
        return ok(
          baseShipments.slice(0, Math.max(12, 48 - idx * 3)).map((s) => ({
            ...s,
            id: `${orgId}-${s.id}`,
          }))
        );
      },
    },
    reports: {
      async summaries() {
        return ok([
          {
            id: "productivity",
            name: "Lister productivity",
            href: "/reports/productivity",
            description: `Posts, lists, ${BRAND.autoList}, and sales by teammate.`,
          },
          {
            id: "operational",
            name: "Operational activity",
            href: "/reports/operational",
            description: `Daily intake → ${BRAND.autoList} → sell → ship.`,
          },
          {
            id: "auto-list",
            name: BRAND.autoList,
            href: "/products/auto-list",
            description: `${BRAND.ai} channel publish queue.`,
          },
        ]);
      },
    },
    photos: {
      async forProduct(orgId, productId) {
        const product = scopeProducts(orgId).find((p) => p.id === productId);
        if (!product) return fail("Product not found", "NOT_FOUND");
        return ok(
          product.imageUrls.map((url, i) => ({
            id: `${productId}-photo-${i}`,
            productId,
            url,
            sortOrder: i,
          }))
        );
      },
    },
    connections: {
      async list(orgId) {
        return ok(loadConnections(orgId));
      },
      async connect(orgId, channel) {
        const connections = loadConnections(orgId);
        const next = connections.map((c) =>
          c.channel === channel
            ? {
                ...c,
                status: "Connected" as const,
                syncEnabled: true,
                lastSyncAt: new Date().toISOString(),
                notes: `Connected via demo OAuth stub at ${new Date().toLocaleString()}.`,
              }
            : c
        );
        saveConnections(orgId, next);
        return ok(next.find((c) => c.channel === channel)!);
      },
      async disconnect(orgId, channel) {
        const connections = loadConnections(orgId);
        const next = connections.map((c) =>
          c.channel === channel
            ? {
                ...c,
                status: "Not connected" as const,
                syncEnabled: false,
                lastSyncAt: null,
                notes: "Disconnected in demo. Reconnect to resume sync.",
              }
            : c
        );
        saveConnections(orgId, next);
        return ok(next.find((c) => c.channel === channel)!);
      },
      async syncNow(orgId, channel) {
        const connections = loadConnections(orgId);
        const current = connections.find((c) => c.channel === channel);
        if (!current || current.status === "Not connected") {
          return fail("Marketplace not connected", "NOT_CONNECTED");
        }
        const next = connections.map((c) =>
          c.channel === channel
            ? { ...c, lastSyncAt: new Date().toISOString(), status: "Connected" as const }
            : c
        );
        saveConnections(orgId, next);
        return ok(next.find((c) => c.channel === channel)!);
      },
    },
    ops: {
      async listOrgHealth() {
        return ok(PILOT_ORGS.map((o) => buildHealth(o.id)));
      },
      async getOrgHealth(orgId) {
        if (!getOrgById(orgId)) return ok(null);
        return ok(buildHealth(orgId));
      },
      async setFlags(orgId, flags) {
        if (!getOrgById(orgId)) return fail("Org not found", "NOT_FOUND");
        const state = loadOps();
        state.byOrg[orgId] = {
          ...state.byOrg[orgId],
          flags: { ...state.byOrg[orgId]?.flags, ...flags },
        };
        saveOps(state);
        return ok(buildHealth(orgId));
      },
      async forceSync(orgId) {
        if (!getOrgById(orgId)) return fail("Org not found", "NOT_FOUND");
        const state = loadOps();
        const prev = state.byOrg[orgId] ?? {};
        state.byOrg[orgId] = {
          ...prev,
          lastForceSyncAt: new Date().toISOString(),
          syncStatus: "healthy",
          errorCount: Math.max(0, (prev.errorCount ?? getOrgById(orgId)!.seedErrorCount) - 3),
        };
        saveOps(state);
        // Also bump connection lastSync
        const connections = loadConnections(orgId).map((c) =>
          c.status === "Connected"
            ? { ...c, lastSyncAt: new Date().toISOString() }
            : c
        );
        saveConnections(orgId, connections);
        return ok(buildHealth(orgId));
      },
      async recentErrors(orgId) {
        return ok(seedErrors(orgId));
      },
    },
  };
}

/** @deprecated Prefer createApiClient from `@/lib/api` (env-based mock | live). */
export function createApiClient(): ApiClient {
  return createMockApiClient();
}
