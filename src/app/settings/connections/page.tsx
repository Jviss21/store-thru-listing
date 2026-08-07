"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Badge, PageHeader } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import { SectionEventLog } from "@/components/SectionEventLog";
import type { MarketplaceConnectionState } from "@/lib/api";
import { logEvent } from "@/lib/event-log";
import { relativeTime } from "@/lib/utils";

function extractAuthorizeUrl(notes: string): string | null {
  const m = notes.match(/Authorize at:\s*(\S+)/);
  return m?.[1] && m[1] !== "(url" && m[1] !== "(url pending)" ? m[1] : null;
}

function modeFromNotes(notes: string): "fake" | "live" | "stub" {
  const lower = notes.toLowerCase();
  if (lower.includes("fake mode") || lower.includes("hammoq market")) return "fake";
  if (lower.includes("stub mode") || lower.includes("missing env")) return "stub";
  if (lower.includes("live mode") || lower.includes("oauth")) return "live";
  return "stub";
}

export default function SettingsConnectionsPage() {
  const { org, api, hydrated } = useOrg();
  const [connections, setConnections] = useState<MarketplaceConnectionState[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await api.connections.list(org.id);
    if (res.ok) setConnections(res.data);
  }, [api, org.id]);

  useEffect(() => {
    if (!hydrated) return;
    void reload();
  }, [hydrated, reload]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ebay = params.get("ebay");
    if (ebay === "connected") {
      setFlash("eBay connected — refresh token stored.");
      window.history.replaceState({}, "", "/settings/connections");
      void reload();
    } else if (ebay === "error") {
      setFlash(params.get("message") || "eBay OAuth failed");
      window.history.replaceState({}, "", "/settings/connections");
    }
  }, [reload]);

  function toast(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2800);
  }

  async function connect(channel: "ShopGoodwill" | "eBay") {
    setBusy(channel);
    const res = await api.connections.connect(org.id, channel);
    setBusy(null);
    if (!res.ok) {
      toast(res.error);
      return;
    }

    const authorizeUrl = extractAuthorizeUrl(res.data.notes);
    const mode = modeFromNotes(res.data.notes);

    if (mode === "live" && authorizeUrl && channel === "eBay") {
      toast(`Redirecting to ${channel} OAuth…`);
      window.location.href = authorizeUrl;
      return;
    }

    await reload();
    logEvent({
      section: "admin",
      action: mode === "fake" ? `Enabled fake ${channel}` : `Connected ${channel}`,
      resource: `${channel} connection`,
      resourceHref: "/settings/connections",
      orgId: org.id,
    });
    toast(
      mode === "fake"
        ? `${channel} ready (fake / Hammoq Market — no OAuth).`
        : `${channel} connected for ${org.name}.`
    );
  }

  async function disconnect(channel: "ShopGoodwill" | "eBay") {
    setBusy(channel);
    const res = await api.connections.disconnect(org.id, channel);
    setBusy(null);
    if (res.ok) {
      await reload();
      logEvent({
        section: "admin",
        action: `Disconnected ${channel}`,
        resource: `${channel} connection`,
        resourceHref: "/settings/connections",
        orgId: org.id,
      });
      toast(`${channel} disconnected.`);
    } else {
      toast(res.error);
    }
  }

  async function syncNow(channel: "ShopGoodwill" | "eBay") {
    setBusy(`sync-${channel}`);
    const res = await api.connections.syncNow(org.id, channel);
    setBusy(null);
    if (res.ok) {
      await reload();
      logEvent({
        section: "admin",
        action: `Synced ${channel}`,
        resource: `${channel} connection`,
        resourceHref: "/settings/connections",
        orgId: org.id,
      });
      toast(`${channel} sync completed.`);
    } else {
      toast(res.error);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Marketplace connections"
        description={`Connect ShopGoodwill and eBay for ${org.name}. Mode is fake (Hammoq Market), live (real OAuth), or stub (missing keys).`}
        howTo={[
          "Connect or reconnect a channel, then wait for the last-sync stamp.",
          "Use Admin → All connections for org-wide marketplace settings.",
          "If status is stub, add API keys in env before going live.",
        ]}
        actions={
          <Link href="/admin/marketplaces" className="text-sm font-semibold text-muted hover:text-ink">
            Admin view →
          </Link>
        }
      />

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      {!hydrated ? (
        <p className="text-sm text-muted">Loading connections…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {connections.map((c) => {
            const connected = c.status === "Connected";
            const needs = c.status === "Needs attention";
            const mode = modeFromNotes(c.notes);
            return (
              <Card key={c.id} className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{c.channel}</h3>
                    <p className="mt-0.5 text-sm text-muted">{c.accountName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={connected ? "green" : needs ? "orange" : "red"}>
                      {c.status === "Not connected" ? "Not connected" : c.status}
                    </Badge>
                    <Badge tone={mode === "live" ? "green" : mode === "fake" ? "orange" : "red"}>
                      {mode}
                    </Badge>
                  </div>
                </div>
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Account ID</dt>
                    <dd className="font-mono text-xs text-ink">{c.accountId || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Last sync</dt>
                    <dd className="text-ink">
                      {c.lastSyncAt ? relativeTime(c.lastSyncAt) : "—"}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted">{c.notes}</p>
                <div className="flex flex-wrap gap-2">
                  {connected ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => syncNow(c.channel)}
                      >
                        {busy === `sync-${c.channel}` ? "Syncing…" : "Sync now"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => disconnect(c.channel)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="accent"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => connect(c.channel)}
                    >
                      {busy === c.channel
                        ? "Connecting…"
                        : mode === "live"
                          ? `Connect ${c.channel} (OAuth)`
                          : mode === "fake"
                            ? `Enable ${c.channel} (fake)`
                            : `Connect ${c.channel}`}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SectionEventLog section="admin" title="Event log" />
    </div>
  );
}
