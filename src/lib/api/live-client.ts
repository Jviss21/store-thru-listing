/**
 * Live API client — keeps mock data for products/orders/ops while routing
 * marketplace connection actions through ShopGoodwill / eBay (via API).
 *
 * Modes for eBay: fake (Hammoq Market) | live (real OAuth) | stub (missing keys).
 */

import { createMockApiClient } from "./mock-client";
import type { ApiClient, ApiResult, MarketplaceConnectionState } from "./types";

type ChannelMode = "stub" | "live" | "fake";

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

function modeLabel(mode: ChannelMode | undefined): string {
  if (mode === "fake") return "fake (Hammoq Market)";
  if (mode === "live") return "live (real eBay)";
  return "stub";
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
          shopgoodwill: { configured: boolean; missingEnv: string[]; mode?: ChannelMode };
          ebay: {
            configured: boolean;
            missingEnv: string[];
            mode?: ChannelMode;
            fakeEbayBaseUrl?: string | null;
          };
        }>(res);

        const base = await mock.connections.list(orgId);
        if (!base.ok) return base;

        if (!status.ok) return base;

        return {
          ok: true,
          data: base.data.map((c) => {
            const cfg =
              c.channel === "ShopGoodwill" ? status.data.shopgoodwill : status.data.ebay;
            const mode = cfg.mode || (cfg.configured ? "live" : "stub");
            const missing = cfg.missingEnv.join(", ") || "none";
            let notes: string;
            if (mode === "fake") {
              const baseUrl =
                c.channel === "eBay"
                  ? (status.data.ebay.fakeEbayBaseUrl || "Hammoq Market")
                  : "channel";
              notes = `Fake mode — ${c.channel} publishes to ${baseUrl}. No OAuth.`;
            } else if (mode === "live" && cfg.configured) {
              notes = `Live mode — ${c.channel} credentials present. Connect starts real OAuth.`;
            } else {
              notes = `Stub mode — missing env: ${missing}. Real OAuth blocked until keys are set.`;
            }
            return { ...c, notes };
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
          authorizeUrl?: string | null;
          state?: string | null;
          configured: boolean;
          missingEnv: string[];
          mode?: ChannelMode;
          message?: string;
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

        const mode = result.data.mode || "live";

        // Fake: mark connected locally — no OAuth redirect
        if (mode === "fake") {
          const mockConnect = await mock.connections.connect(orgId, channel);
          if (mockConnect.ok) {
            return {
              ok: true,
              data: {
                ...mockConnect.data,
                notes:
                  result.data.message ||
                  `Fake mode (${modeLabel(mode)}) — no OAuth. Publish via Mock channel list.`,
              },
            };
          }
          return {
            ok: true,
            data: connectionFromStub(channel, {
              status: "Connected",
              syncEnabled: true,
              lastSyncAt: new Date().toISOString(),
              notes: result.data.message || "Fake mode — no OAuth.",
            }),
          };
        }

        // Live: return authorize URL for the UI to redirect
        if (result.data.authorizeUrl) {
          return {
            ok: true,
            data: connectionFromStub(channel, {
              status: "Not connected",
              syncEnabled: false,
              notes: `OAuth ready. Authorize at: ${result.data.authorizeUrl}`,
              accountName: `${channel} (OAuth pending)`,
            }),
          };
        }

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
              notes: `Sync: ${result.data.count} listings @ ${result.data.syncedAt}`,
            },
          };
        }
        return {
          ok: true,
          data: connectionFromStub(channel, {
            status: "Connected",
            syncEnabled: true,
            lastSyncAt: result.data.syncedAt,
            notes: `Sync complete (${result.data.count}).`,
          }),
        };
      },
    },
  };
}
