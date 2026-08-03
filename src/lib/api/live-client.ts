/**
 * Live API client — keeps mock data for products/orders/ops while routing
 * marketplace connection actions through ShopGoodwill / eBay stubs (via API).
 */

import { createMockApiClient } from "./mock-client";
import type { ApiClient, ApiResult, MarketplaceConnectionState } from "./types";

async function jsonResult<T>(res: Response): Promise<ApiResult<T>> {
  try {
    const body = (await res.json()) as ApiResult<T>;
    if (body && typeof body === "object" && "ok" in body) return body;
    return { ok: false, error: "Unexpected marketplace API response", code: "BAD_RESPONSE" };
  } catch {
    return { ok: false, error: `Marketplace API HTTP ${res.status}`, code: "HTTP_ERROR" };
  }
}

function connectionFromStub(
  channel: "ShopGoodwill" | "eBay",
  patch: Partial<MarketplaceConnectionState> & { notes: string; status: MarketplaceConnectionState["status"] }
): MarketplaceConnectionState {
  return {
    id: `${channel.toLowerCase()}-live`,
    channel,
    accountId: patch.accountId ?? "",
    accountName: patch.accountName ?? `${channel} (live stub)`,
    status: patch.status,
    syncEnabled: patch.syncEnabled ?? patch.status === "Connected",
    lastSyncAt: patch.lastSyncAt ?? null,
    notes: patch.notes,
  };
}

/**
 * Compose mock domain data with live marketplace connection adapters.
 * When marketplace keys are missing, connect/sync return NOT_CONFIGURED clearly.
 */
export function createLiveApiClient(): ApiClient {
  const mock = createMockApiClient();

  return {
    ...mock,
    connections: {
      async list(orgId) {
        const res = await fetch(`/api/marketplaces/status?orgId=${encodeURIComponent(orgId)}`);
        const status = await jsonResult<{
          shopgoodwill: { configured: boolean; missingEnv: string[] };
          ebay: { configured: boolean; missingEnv: string[] };
        }>(res);

        const base = await mock.connections.list(orgId);
        if (!base.ok) return base;

        if (!status.ok) return base;

        return {
          ok: true,
          data: base.data.map((c) => {
            const cfg =
              c.channel === "ShopGoodwill" ? status.data.shopgoodwill : status.data.ebay;
            const missing = cfg.missingEnv.join(", ") || "none";
            return {
              ...c,
              notes: cfg.configured
                ? `Live mode — ${c.channel} credentials present. ${c.notes}`
                : `Live mode stub — missing env: ${missing}. UI still works; real OAuth blocked until keys are set.`,
            };
          }),
        };
      },

      async connect(orgId, channel) {
        const res = await fetch("/api/marketplaces/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId, channel }),
        });
        const result = await jsonResult<{
          authorizeUrl?: string;
          state?: string;
          configured: boolean;
          missingEnv: string[];
        }>(res);

        if (!result.ok) {
          return {
            ok: false,
            error: result.error,
            code: result.code,
          };
        }

        if (!result.data.configured) {
          return {
            ok: false,
            error: `${channel} not configured. Set: ${result.data.missingEnv.join(", ")}`,
            code: "NOT_CONFIGURED",
          };
        }

        // OAuth URL available — mark connected in UI stub until callback is wired
        const mockConnect = await mock.connections.connect(orgId, channel);
        if (mockConnect.ok) {
          return {
            ok: true,
            data: {
              ...mockConnect.data,
              notes: `OAuth ready. Authorize at: ${result.data.authorizeUrl ?? "(url pending)"}`,
            },
          };
        }
        return {
          ok: true,
          data: connectionFromStub(channel, {
            status: "Connected",
            syncEnabled: true,
            lastSyncAt: new Date().toISOString(),
            notes: `OAuth authorize URL issued (state ${result.data.state}).`,
          }),
        };
      },

      async disconnect(orgId, channel) {
        return mock.connections.disconnect(orgId, channel);
      },

      async syncNow(orgId, channel) {
        const res = await fetch("/api/marketplaces/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId, channel }),
        });
        const result = await jsonResult<{ syncedAt: string; count: number }>(res);
        if (!result.ok) return { ok: false, error: result.error, code: result.code };

        const mockSync = await mock.connections.syncNow(orgId, channel);
        if (mockSync.ok) {
          return {
            ok: true,
            data: {
              ...mockSync.data,
              lastSyncAt: result.data.syncedAt,
              notes: `Live stub sync: ${result.data.count} listings @ ${result.data.syncedAt}`,
            },
          };
        }
        return {
          ok: true,
          data: connectionFromStub(channel, {
            status: "Connected",
            syncEnabled: true,
            lastSyncAt: result.data.syncedAt,
            notes: `Live stub sync complete (${result.data.count}).`,
          }),
        };
      },
    },
  };
}
