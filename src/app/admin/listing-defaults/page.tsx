"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { CARRIERS } from "@/lib/mock-data";
import {
  LISTING_STRATEGIES,
  type ListingStrategy,
  cloneStrategies,
} from "@/lib/listing-strategies";
import { loadAdminState, saveAdminState, type AdminPersistedState } from "@/lib/admin-settings";

export default function AdminListingDefaultsPage() {
  const [state, setState] = useState<AdminPersistedState | null>(null);
  const [saved, setSaved] = useState(false);
  const [selectedId, setSelectedId] = useState(LISTING_STRATEGIES[0]?.id ?? "");

  useEffect(() => {
    const loaded = loadAdminState();
    if (!loaded.strategies?.length) {
      loaded.strategies = cloneStrategies();
    }
    setState(loaded);
    setSelectedId(loaded.strategies[0]?.id ?? LISTING_STRATEGIES[0]!.id);
  }, []);

  function updateDefault<K extends keyof AdminPersistedState["listingDefaults"]>(
    key: K,
    value: AdminPersistedState["listingDefaults"][K]
  ) {
    if (!state) return;
    setState({
      ...state,
      listingDefaults: { ...state.listingDefaults, [key]: value },
    });
  }

  function updateStrategy(partial: Partial<ListingStrategy>) {
    if (!state) return;
    setState({
      ...state,
      strategies: state.strategies.map((s) =>
        s.id === selectedId ? { ...s, ...partial } : s
      ),
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
  const strategies = state.strategies.length ? state.strategies : cloneStrategies();
  const selected = strategies.find((s) => s.id === selectedId) ?? strategies[0]!;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Listing defaults</h2>
        <p className="mt-1 text-sm text-muted">
          Strategies drive Auto-List / upload defaults (weight, dims, shipping, pricing, profiles).
          Selecting a strategy on a product or listing form auto-fills those fields.
        </p>
      </div>

      <Card className="max-w-2xl space-y-4 p-5">
        <h3 className="font-semibold">Org defaults</h3>
        <div>
          <label className="text-sm font-medium">Default strategy</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
            value={d.defaultStrategy}
            onChange={(e) => updateDefault("defaultStrategy", e.target.value)}
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Default carrier</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
            value={d.defaultCarrier}
            onChange={(e) => updateDefault("defaultCarrier", e.target.value)}
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
          <Input className="mt-1" value={d.shippingPolicy} onChange={(e) => updateDefault("shippingPolicy", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Returns policy</label>
          <Input className="mt-1" value={d.returnsPolicy} onChange={(e) => updateDefault("returnsPolicy", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Payment policy</label>
          <Input className="mt-1" value={d.paymentPolicy} onChange={(e) => updateDefault("paymentPolicy", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Item location</label>
          <Input className="mt-1" value={d.itemLocation} onChange={(e) => updateDefault("itemLocation", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">eBay duration</label>
            <Input className="mt-1" value={d.ebayDuration} onChange={(e) => updateDefault("ebayDuration", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">ShopGoodwill duration</label>
            <Input className="mt-1" value={d.sgwDuration} onChange={(e) => updateDefault("sgwDuration", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="max-w-3xl space-y-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-semibold">Edit strategies</h3>
            <p className="text-xs text-muted">
              Changes apply on this device. Product/listing Strategy pickers use these names.
            </p>
          </div>
          <select
            className="h-10 min-w-[240px] rounded-xl border border-ink/10 bg-white px-3 text-sm"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              className="mt-1"
              value={selected.name}
              onChange={(e) => updateStrategy({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Channel</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm"
              value={selected.channel}
              onChange={(e) =>
                updateStrategy({ channel: e.target.value as ListingStrategy["channel"] })
              }
            >
              <option value="Both">Both</option>
              <option value="eBay">eBay</option>
              <option value="ShopGoodwill">ShopGoodwill</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Listing type</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm"
              value={selected.listingType}
              onChange={(e) =>
                updateStrategy({ listingType: e.target.value as ListingStrategy["listingType"] })
              }
            >
              <option value="Auction">Auction</option>
              <option value="Fixed Price">Fixed Price</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Default weight (lbs)</label>
            <Input
              className="mt-1"
              type="number"
              step="0.01"
              value={selected.defaultWeightLbs}
              onChange={(e) => updateStrategy({ defaultWeightLbs: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Shipping weight (lbs)</label>
            <Input
              className="mt-1"
              type="number"
              step="0.01"
              value={selected.shippingWeightLbs}
              onChange={(e) => updateStrategy({ shippingWeightLbs: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Length (in)</label>
            <Input
              className="mt-1"
              type="number"
              value={selected.lengthIn}
              onChange={(e) => updateStrategy({ lengthIn: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Width (in)</label>
            <Input
              className="mt-1"
              type="number"
              value={selected.widthIn}
              onChange={(e) => updateStrategy({ widthIn: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Height (in)</label>
            <Input
              className="mt-1"
              type="number"
              value={selected.heightIn}
              onChange={(e) => updateStrategy({ heightIn: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Box padding</label>
            <Input
              className="mt-1"
              value={selected.boxPadding}
              onChange={(e) => updateStrategy({ boxPadding: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Carrier / method</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm"
              value={selected.carrier}
              onChange={(e) =>
                updateStrategy({ carrier: e.target.value, shippingMethod: e.target.value })
              }
            >
              {CARRIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Shipping box</label>
            <Input
              className="mt-1"
              value={selected.shippingBox}
              onChange={(e) => updateStrategy({ shippingBox: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Starting price</label>
            <Input
              className="mt-1"
              type="number"
              step="0.01"
              value={selected.startingPrice}
              onChange={(e) => updateStrategy({ startingPrice: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Buy It Now</label>
            <Input
              className="mt-1"
              type="number"
              step="0.01"
              value={selected.buyItNowPrice ?? ""}
              onChange={(e) =>
                updateStrategy({
                  buyItNowPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Duration</label>
            <Input
              className="mt-1"
              value={selected.listingDuration}
              onChange={(e) => updateStrategy({ listingDuration: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Handling time (days)</label>
            <Input
              className="mt-1"
              type="number"
              value={selected.handlingTimeDays}
              onChange={(e) => updateStrategy({ handlingTimeDays: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Stock quantity</label>
            <Input
              className="mt-1"
              type="number"
              min={1}
              value={selected.stockQuantity}
              onChange={(e) =>
                updateStrategy({ stockQuantity: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Shipping profile</label>
            <Input
              className="mt-1"
              value={selected.shippingPolicy}
              onChange={(e) => updateStrategy({ shippingPolicy: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Returns profile</label>
            <Input
              className="mt-1"
              value={selected.returnsPolicy}
              onChange={(e) => updateStrategy({ returnsPolicy: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Payment profile</label>
            <Input
              className="mt-1"
              value={selected.paymentPolicy}
              onChange={(e) => updateStrategy({ paymentPolicy: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <Input
              className="mt-1"
              value={selected.notes ?? ""}
              onChange={(e) => updateStrategy({ notes: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={persist}>
          Save defaults
        </Button>
        {saved && <p className="text-sm text-mustard">Saved on this device.</p>}
      </div>
    </div>
  );
}
