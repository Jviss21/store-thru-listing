"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldHelp,
  FieldLabel,
  SaveBar,
  SectionCard,
  SelectField,
} from "@/components/admin/AdminForm";
import { Button, Input } from "@/components/ui";
import {
  cloneStrategies,
  defaultLifecycleSteps,
  ensureStrategySteps,
  type ListingStrategy,
  type StrategyStep,
  type StrategyStepKind,
} from "@/lib/listing-strategies";
import { loadAdminState, saveAdminState } from "@/lib/admin-settings";
import { logEvent } from "@/lib/event-log";

const STEP_KINDS: StrategyStepKind[] = [
  "queued",
  "auction",
  "bin",
  "multi_channel",
  "handoff",
  "purge",
];

const KIND_LABEL: Record<StrategyStepKind, string> = {
  queued: "Queued",
  auction: "Auction",
  bin: "Buy It Now",
  multi_channel: "Multi-channel",
  handoff: "Handoff",
  purge: "Purge",
};

function blankStep(kind: StrategyStepKind = "auction"): StrategyStep {
  return {
    id: `step-${kind}-${Date.now().toString(36)}`,
    kind,
    label: KIND_LABEL[kind],
    durationDays: kind === "queued" || kind === "purge" ? 0 : 7,
    targetStatus: kind === "queued" ? "Queued" : kind === "purge" ? "Recycled" : "Active",
    listingType: kind === "auction" ? "Auction" : "Fixed Price",
    channels: kind === "purge" ? [] : ["eBay", "ShopGoodwill"],
    priceMode:
      kind === "auction" ? "starting" : kind === "bin" ? "bin" : kind === "handoff" ? "reduce_pct" : "hold",
    priceValue: kind === "handoff" ? 20 : undefined,
    nextAction:
      kind === "purge"
        ? "Lifecycle complete"
        : kind === "queued"
          ? "Publish listing"
          : `Complete ${KIND_LABEL[kind]} then advance`,
  };
}

export default function AdminListingStrategiesPage() {
  const [strategies, setStrategies] = useState<ListingStrategy[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const state = loadAdminState();
    const list = (state.strategies?.length ? state.strategies : cloneStrategies()).map(
      ensureStrategySteps
    );
    setStrategies(list);
    setSelectedId(list[0]?.id ?? "");
    setReady(true);
  }, []);

  const selected =
    strategies.find((s) => s.id === selectedId) ?? strategies[0] ?? null;
  const steps = selected?.steps ?? [];

  function updateSelected(partial: Partial<ListingStrategy>) {
    if (!selected) return;
    setStrategies((prev) =>
      prev.map((s) => (s.id === selected.id ? { ...s, ...partial } : s))
    );
  }

  function updateStep(stepId: string, partial: Partial<StrategyStep>) {
    if (!selected) return;
    updateSelected({
      steps: (selected.steps ?? []).map((st) =>
        st.id === stepId ? { ...st, ...partial } : st
      ),
    });
  }

  function toggleChannel(stepId: string, ch: "eBay" | "ShopGoodwill") {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    const has = step.channels.includes(ch);
    const channels = has
      ? step.channels.filter((c) => c !== ch)
      : [...step.channels, ch];
    updateStep(stepId, { channels });
  }

  function addStep() {
    updateSelected({ steps: [...steps, blankStep("bin")] });
  }

  function removeStep(stepId: string) {
    updateSelected({ steps: steps.filter((s) => s.id !== stepId) });
  }

  function resetPipeline() {
    if (!selected) return;
    updateSelected({ steps: defaultLifecycleSteps(selected) });
  }

  function persist() {
    const state = loadAdminState();
    const next = {
      ...state,
      strategies: strategies.map(ensureStrategySteps),
    };
    saveAdminState(next);
    logEvent({
      section: "admin",
      action: "Updated listing strategy lifecycle",
      resource: selected ? `Strategy · ${selected.name}` : "Strategies",
      resourceHref: "/admin/listing-strategies",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!ready || !selected) {
    return <p className="text-sm text-muted">Loading listing strategies…</p>;
  }

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Listing Strategies"]} />
      <AdminPageIntro
        title="Listing Strategies"
        description="Configure multi-step lifecycles (auction → BIN → multi-channel → handoff → purge). Form field defaults still live under Listing defaults."
        actions={
          <Link
            href="/admin/listing-defaults"
            className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
          >
            Edit form defaults →
          </Link>
        }
      />

      <SectionCard title="Strategy">
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel>Select strategy</FieldLabel>
            <SelectField
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Name</FieldLabel>
            <Input
              className="mt-1"
              value={selected.name}
              onChange={(e) => updateSelected({ name: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Channel preference</FieldLabel>
            <SelectField
              value={selected.channel}
              onChange={(e) =>
                updateSelected({
                  channel: e.target.value as ListingStrategy["channel"],
                })
              }
            >
              <option value="Both">Both</option>
              <option value="eBay">eBay</option>
              <option value="ShopGoodwill">ShopGoodwill</option>
            </SelectField>
          </div>
          <div>
            <FieldLabel>Default listing type</FieldLabel>
            <SelectField
              value={selected.listingType}
              onChange={(e) =>
                updateSelected({
                  listingType: e.target.value as ListingStrategy["listingType"],
                })
              }
            >
              <option value="Auction">Auction</option>
              <option value="Fixed Price">Fixed Price</option>
            </SelectField>
          </div>
        </div>
        <FieldHelp>
          Assign this strategy on a product/listing. Floor users advance steps from the listing
          detail page (simulated marketplace effects).
        </FieldHelp>
      </SectionCard>

      <SectionCard title="Lifecycle steps">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={resetPipeline}>
            Reset to default pipeline
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="h-3.5 w-3.5" /> Add step
          </Button>
        </div>
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className="rounded-xl border border-ink/10 bg-white/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  Step {idx + 1}: {step.label}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(step.id)}
                  disabled={steps.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <FieldLabel>Kind</FieldLabel>
                  <SelectField
                    value={step.kind}
                    onChange={(e) => {
                      const kind = e.target.value as StrategyStepKind;
                      updateStep(step.id, {
                        kind,
                        label: KIND_LABEL[kind],
                      });
                    }}
                  >
                    {STEP_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div>
                  <FieldLabel>Label</FieldLabel>
                  <Input
                    className="mt-1"
                    value={step.label}
                    onChange={(e) => updateStep(step.id, { label: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>Duration (days)</FieldLabel>
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    value={step.durationDays}
                    onChange={(e) =>
                      updateStep(step.id, {
                        durationDays: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Target status</FieldLabel>
                  <SelectField
                    value={step.targetStatus}
                    onChange={(e) =>
                      updateStep(step.id, {
                        targetStatus: e.target.value as StrategyStep["targetStatus"],
                      })
                    }
                  >
                    <option value="Queued">Queued</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Delisted">Delisted</option>
                    <option value="Recycled">Recycled</option>
                  </SelectField>
                </div>
                <div>
                  <FieldLabel>Listing type</FieldLabel>
                  <SelectField
                    value={step.listingType ?? ""}
                    onChange={(e) =>
                      updateStep(step.id, {
                        listingType: e.target.value
                          ? (e.target.value as StrategyStep["listingType"])
                          : undefined,
                      })
                    }
                  >
                    <option value="">(unchanged)</option>
                    <option value="Auction">Auction</option>
                    <option value="Fixed Price">Fixed Price</option>
                  </SelectField>
                </div>
                <div>
                  <FieldLabel>Price mode</FieldLabel>
                  <SelectField
                    value={step.priceMode}
                    onChange={(e) =>
                      updateStep(step.id, {
                        priceMode: e.target.value as StrategyStep["priceMode"],
                      })
                    }
                  >
                    <option value="starting">Starting / auction</option>
                    <option value="bin">Buy It Now</option>
                    <option value="reduce_pct">Reduce %</option>
                    <option value="hold">Hold price</option>
                  </SelectField>
                </div>
                {step.priceMode === "reduce_pct" && (
                  <div>
                    <FieldLabel>Reduce %</FieldLabel>
                    <Input
                      className="mt-1"
                      type="number"
                      min={0}
                      max={90}
                      value={step.priceValue ?? 20}
                      onChange={(e) =>
                        updateStep(step.id, {
                          priceValue: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}
                <div className="sm:col-span-2 lg:col-span-3">
                  <FieldLabel>Channels</FieldLabel>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    {(["eBay", "ShopGoodwill"] as const).map((ch) => (
                      <label key={ch} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={step.channels.includes(ch)}
                          onChange={() => toggleChannel(step.id, ch)}
                        />
                        {ch}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <FieldLabel>Next action (floor copy)</FieldLabel>
                  <Input
                    className="mt-1"
                    value={step.nextAction}
                    onChange={(e) =>
                      updateStep(step.id, { nextAction: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <SaveBar saved={saved} onSave={persist} />
        </div>
      </SectionCard>
    </div>
  );
}
