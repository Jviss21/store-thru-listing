"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Badge } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { BRAND } from "@/lib/mock-data";
import { loadAdminState, saveAdminState, type AdminPersistedState } from "@/lib/admin-settings";
import { logEvent } from "@/lib/event-log";

export default function AdminInfinityAiPage() {
  const [state, setState] = useState<AdminPersistedState | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setState(loadAdminState());
  }, []);

  function updateAi<K extends keyof AdminPersistedState["ai"]>(
    key: K,
    value: AdminPersistedState["ai"][K]
  ) {
    if (!state) return;
    setState({ ...state, ai: { ...state.ai, [key]: value } });
  }

  function persist() {
    if (!state) return;
    saveAdminState(state);
    logEvent({
      section: "admin",
      action: "Saved Infinity AI / Auto-List settings",
      resource: BRAND.ai,
      resourceHref: "/admin/infinity-ai",
      detail: `Confidence ${state.ai.confidenceThreshold}% · min photos ${state.ai.requirePhotoMin}`,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!state) {
    return <p className="text-sm text-muted">Loading {BRAND.ai}…</p>;
  }

  const ai = state.ai;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <InfinityBadge />
        <h2 className="font-display text-2xl font-bold text-ink">{BRAND.ai}</h2>
      </div>
      <p className="text-sm text-muted">
        Org-level controls for {BRAND.autoList}. Confidence gates and category routing decide what
        publishes automatically vs. landing in Additional QA Required.
      </p>

      <Card className="max-w-2xl space-y-4 p-5">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="font-semibold text-ink">{BRAND.autoList} enabled</span>
            <span className="mt-0.5 block text-muted">
              Push ready products to ShopGoodwill and eBay
            </span>
          </span>
          <input
            type="checkbox"
            checked={ai.autoListEnabled}
            onChange={(e) => updateAi("autoListEnabled", e.target.checked)}
          />
        </label>

        <div>
          <label className="text-sm font-medium">
            Confidence threshold ({ai.confidenceThreshold}%)
          </label>
          <input
            type="range"
            min={70}
            max={99}
            className="mt-2 w-full accent-[var(--gold)]"
            value={ai.confidenceThreshold}
            onChange={(e) => updateAi("confidenceThreshold", Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-muted">
            Below threshold → hold in Queued / Additional QA Required instead of live publish.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Minimum photos required</label>
          <Input
            type="number"
            min={1}
            max={12}
            className="mt-1 max-w-[8rem]"
            value={ai.requirePhotoMin}
            onChange={(e) => updateAi("requirePhotoMin", Number(e.target.value) || 1)}
          />
        </div>

        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="font-semibold text-ink">Hold authenticated items</span>
            <span className="mt-0.5 block text-muted">
              Designer / luxury SKUs need Ops Lead or Admin clearance
            </span>
          </span>
          <input
            type="checkbox"
            checked={ai.holdAuthenticated}
            onChange={(e) => updateAi("holdAuthenticated", e.target.checked)}
          />
        </label>

        {ai.holdAuthenticated && (
          <div>
            <label className="text-sm font-medium">
              Authenticated min confidence ({ai.authenticatedMinConfidence}%)
            </label>
            <input
              type="range"
              min={85}
              max={99}
              className="mt-2 w-full accent-[var(--orange)]"
              value={ai.authenticatedMinConfidence}
              onChange={(e) => updateAi("authenticatedMinConfidence", Number(e.target.value))}
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Handling notes</label>
          <textarea
            className="mt-1 min-h-[96px] w-full rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40"
            value={ai.notes}
            onChange={(e) => updateAi("notes", e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={persist}>
            Save {BRAND.ai} settings
          </Button>
          {saved && <p className="text-sm text-mustard">Saved on this device.</p>}
        </div>
      </Card>

      <div>
        <h3 className="font-display text-lg font-bold text-ink">Category routing</h3>
        <p className="mt-1 text-sm text-muted">
          Preferred channel when {BRAND.autoList} publishes. Both = list on SGW and eBay when ready.
        </p>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Category</th>
              <th className="px-4 py-2.5 font-semibold">Preferred channel</th>
            </tr>
          </thead>
          <tbody>
            {ai.categoryRouting.map((row, i) => (
              <tr key={row.category} className="border-b border-ink/5">
                <td className="px-4 py-3 font-medium text-ink">{row.category}</td>
                <td className="px-4 py-3">
                  <select
                    className="h-9 rounded-lg border border-ink/10 bg-white px-2 text-sm"
                    value={row.preferredChannel}
                    onChange={(e) => {
                      const next = [...ai.categoryRouting];
                      next[i] = {
                        ...row,
                        preferredChannel: e.target.value as "ShopGoodwill" | "eBay" | "Both",
                      };
                      updateAi("categoryRouting", next);
                    }}
                  >
                    <option value="ShopGoodwill">ShopGoodwill</option>
                    <option value="eBay">eBay</option>
                    <option value="Both">Both</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <Badge tone="yellow">{BRAND.autoList}</Badge>
        <span className="text-sm text-muted">
          Status: {ai.autoListEnabled ? "Enabled for this org" : "Paused"} · threshold{" "}
          {ai.confidenceThreshold}%
        </span>
      </Card>
    </div>
  );
}
