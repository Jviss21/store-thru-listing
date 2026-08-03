"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { CARRIERS, STRATEGIES } from "@/lib/mock-data";
import { loadAdminState, saveAdminState, type AdminPersistedState } from "@/lib/admin-settings";

export default function AdminListingDefaultsPage() {
  const [state, setState] = useState<AdminPersistedState | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setState(loadAdminState());
  }, []);

  function update<K extends keyof AdminPersistedState["listingDefaults"]>(
    key: K,
    value: AdminPersistedState["listingDefaults"][K]
  ) {
    if (!state) return;
    setState({
      ...state,
      listingDefaults: { ...state.listingDefaults, [key]: value },
    });
  }

  function persist() {
    if (!state) return;
    saveAdminState(state);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!state) {
    return <p className="text-sm text-muted">Loading listing defaults…</p>;
  }

  const d = state.listingDefaults;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Listing defaults</h2>
        <p className="mt-1 text-sm text-muted">
          Strategies, carriers, and policy text applied when creating eBay / ShopGoodwill listings.
        </p>
      </div>

      <Card className="max-w-2xl space-y-4 p-5">
        <div>
          <label className="text-sm font-medium">Default strategy</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
            value={d.defaultStrategy}
            onChange={(e) => update("defaultStrategy", e.target.value)}
          >
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Default carrier</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
            value={d.defaultCarrier}
            onChange={(e) => update("defaultCarrier", e.target.value)}
          >
            {CARRIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Shipping policy</label>
          <Input className="mt-1" value={d.shippingPolicy} onChange={(e) => update("shippingPolicy", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Returns policy</label>
          <Input className="mt-1" value={d.returnsPolicy} onChange={(e) => update("returnsPolicy", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Payment policy</label>
          <Input className="mt-1" value={d.paymentPolicy} onChange={(e) => update("paymentPolicy", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Item location</label>
          <Input className="mt-1" value={d.itemLocation} onChange={(e) => update("itemLocation", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">eBay duration</label>
            <Input className="mt-1" value={d.ebayDuration} onChange={(e) => update("ebayDuration", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">ShopGoodwill duration</label>
            <Input className="mt-1" value={d.sgwDuration} onChange={(e) => update("sgwDuration", e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={persist}>
            Save defaults
          </Button>
          {saved && <p className="text-sm text-mustard">Saved on this device.</p>}
        </div>
      </Card>
    </div>
  );
}
