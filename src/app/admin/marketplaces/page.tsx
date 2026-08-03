"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import type { MarketplaceConnectionState } from "@/lib/api";
import { relativeTime } from "@/lib/utils";

export default function AdminMarketplacesPage() {
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

  function toast(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  async function connect(channel: "ShopGoodwill" | "eBay") {
    setBusy(channel);
    toast(`Opening ${channel} OAuth (demo stub)…`);
    await new Promise((r) => setTimeout(r, 500));
    const res = await api.connections.connect(org.id, channel);
    setBusy(null);
    if (res.ok) {
      await reload();
      toast(`${channel} connected.`);
    } else toast(res.error);
  }

  async function disconnect(channel: "ShopGoodwill" | "eBay") {
    setBusy(channel);
    const res = await api.connections.disconnect(org.id, channel);
    setBusy(null);
    if (res.ok) {
      await reload();
      toast(`${channel} disconnected.`);
    } else toast(res.error);
  }

  async function mockSync(channel: "ShopGoodwill" | "eBay") {
    setBusy(`sync-${channel}`);
    const res = await api.connections.syncNow(org.id, channel);
    setBusy(null);
    if (res.ok) {
      await reload();
      toast("Demo sync completed.");
    } else toast(res.error);
  }

  if (!hydrated) {
    return <p className="text-sm text-muted">Loading connections…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Marketplace connections</h2>
        <p className="mt-1 text-sm text-muted">
          ShopGoodwill and eBay account status for {org.name}. Connect uses a stub OAuth flow;
          state persists per org in localStorage.{" "}
          <Link href="/settings/connections" className="font-semibold text-ink underline-offset-2 hover:underline">
            Customer settings view
          </Link>
        </p>
      </div>

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {connections.map((c) => {
          const connected = c.status === "Connected";
          return (
            <Card key={c.id} className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">{c.channel}</h3>
                  <p className="mt-0.5 text-sm text-muted">{c.accountName}</p>
                </div>
                <Badge
                  tone={
                    connected ? "green" : c.status === "Needs attention" ? "orange" : "red"
                  }
                >
                  {c.status}
                </Badge>
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Account ID</dt>
                  <dd className="font-mono text-xs text-ink">{c.accountId}</dd>
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
                      onClick={() => mockSync(c.channel)}
                    >
                      Sync now
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
                    {busy === c.channel ? "Connecting…" : `Connect ${c.channel}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
