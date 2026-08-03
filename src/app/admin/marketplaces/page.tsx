"use client";

import { useEffect, useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { loadAdminState, saveAdminState, type AdminPersistedState } from "@/lib/admin-settings";
import { relativeTime } from "@/lib/utils";

export default function AdminMarketplacesPage() {
  const [state, setState] = useState<AdminPersistedState | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setState(loadAdminState());
  }, []);

  function persist(next: AdminPersistedState, msg?: string) {
    saveAdminState(next);
    setState(next);
    if (msg) {
      setFlash(msg);
      setTimeout(() => setFlash(null), 2000);
    }
  }

  function toggleSync(id: string) {
    if (!state) return;
    persist(
      {
        ...state,
        connections: state.connections.map((c) =>
          c.id === id ? { ...c, syncEnabled: !c.syncEnabled } : c
        ),
      },
      "Sync preference saved."
    );
  }

  function mockSync(id: string) {
    if (!state) return;
    persist(
      {
        ...state,
        connections: state.connections.map((c) =>
          c.id === id
            ? { ...c, lastSyncAt: new Date().toISOString(), status: "Connected" }
            : c
        ),
      },
      "Demo sync completed."
    );
  }

  if (!state) {
    return <p className="text-sm text-muted">Loading connections…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Marketplace connections</h2>
        <p className="mt-1 text-sm text-muted">
          ShopGoodwill and eBay account status for Test Goodwill. Sync toggles persist in
          localStorage.
        </p>
      </div>

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {state.connections.map((c) => (
          <Card key={c.id} className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{c.channel}</h3>
                <p className="mt-0.5 text-sm text-muted">{c.accountName}</p>
              </div>
              <Badge
                tone={
                  c.status === "Connected"
                    ? "green"
                    : c.status === "Needs attention"
                      ? "orange"
                      : "red"
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
                <dd className="text-ink">{relativeTime(c.lastSyncAt)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted">{c.notes}</p>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">Sync enabled</span>
              <input
                type="checkbox"
                checked={c.syncEnabled}
                onChange={() => toggleSync(c.id)}
              />
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => mockSync(c.id)}>
                Sync now
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
