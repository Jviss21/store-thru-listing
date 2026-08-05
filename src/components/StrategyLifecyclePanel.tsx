"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, Play, SkipForward } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import {
  advanceStrategy,
  currentStep,
  describeNextAction,
  ensureRunForListing,
  nextStep,
  resolveStrategy,
  simulateStrategyDays,
  STRATEGY_RUNS_CHANGED,
  type StrategyRun,
} from "@/lib/strategy-engine";
import { getStrategySteps, type ListingStrategy } from "@/lib/listing-strategies";
import type { Listing } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  listing: Listing;
  /** When strategy name changes on the form, re-bind the run. */
  strategyName?: string;
};

export function StrategyLifecyclePanel({ listing, strategyName }: Props) {
  const { org, hydrated } = useOrg();
  const [run, setRun] = useState<StrategyRun | null>(null);
  const [strategy, setStrategy] = useState<ListingStrategy | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const name = strategyName ?? listing.strategy;

  const refresh = useCallback(() => {
    if (!hydrated) return;
    const s = resolveStrategy(name, org.id) ?? null;
    setStrategy(s);
    const ensured = ensureRunForListing({
      orgId: org.id,
      listing: { ...listing, strategy: name },
      strategyNameOrId: name,
    });
    setRun(ensured);
    setReady(true);
  }, [hydrated, org.id, listing, name]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function onChange(e: Event) {
      const detail = (e as CustomEvent).detail as { orgId?: string } | undefined;
      if (detail?.orgId && detail.orgId !== org.id) return;
      refresh();
    }
    window.addEventListener(STRATEGY_RUNS_CHANGED, onChange);
    return () => window.removeEventListener(STRATEGY_RUNS_CHANGED, onChange);
  }, [org.id, refresh]);

  const steps = useMemo(
    () => (strategy ? getStrategySteps(strategy) : []),
    [strategy]
  );
  const cur = run && strategy ? currentStep(run, strategy) : null;
  const nxt = run && strategy ? nextStep(run, strategy) : null;
  const nextAction = describeNextAction(run, strategy);

  function flashMsg(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2800);
  }

  function onAdvance() {
    const result = advanceStrategy(org.id, listing.id);
    if (!result) {
      flashMsg("No strategy run — assign a strategy first.");
      return;
    }
    setRun(result.run);
    flashMsg(result.message);
  }

  function onSimulate(days: number) {
    const result = simulateStrategyDays(org.id, listing.id, days);
    if (!result) {
      flashMsg("No strategy run — assign a strategy first.");
      return;
    }
    setRun(result.run);
    flashMsg(result.message);
  }

  if (!ready) {
    return (
      <Card className="p-4 text-sm text-muted">Loading strategy lifecycle…</Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Strategy lifecycle</h2>
          <p className="mt-0.5 text-xs text-muted">
            Demo runner — advances Queued → Active → price/channel steps without live marketplace
            calls. State: org-scoped localStorage (path to DB: Listing.strategyStep).
          </p>
        </div>
        {run && (
          <Badge
            tone={
              run.phase === "completed"
                ? "green"
                : run.phase === "queued"
                  ? "yellow"
                  : "blue"
            }
          >
            {run.phase === "queued"
              ? "Queued"
              : run.phase === "completed"
                ? "Complete"
                : "Active"}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <div className="rounded-xl bg-mist/70 px-3 py-2">
          <p className="text-[11px] uppercase text-muted">Strategy</p>
          <p className="font-semibold">{run?.strategyName ?? name}</p>
        </div>
        <div className="rounded-xl bg-mist/70 px-3 py-2">
          <p className="text-[11px] uppercase text-muted">Current step</p>
          <p className="font-semibold">{cur?.label ?? "—"}</p>
        </div>
        <div className="rounded-xl bg-mist/70 px-3 py-2">
          <p className="text-[11px] uppercase text-muted">Simulated price</p>
          <p className="font-semibold tabular-nums">
            {run ? formatCurrency(run.currentPrice) : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-mist/70 px-3 py-2">
          <p className="text-[11px] uppercase text-muted">Status / channels</p>
          <p className="font-semibold">
            {run?.listingStatus ?? "—"}
            {run?.activeChannels?.length
              ? ` · ${run.activeChannels.join(" + ")}`
              : ""}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
        <span className="font-semibold">Next action:</span> {nextAction}
        {nxt ? (
          <span className="text-muted"> · then “{nxt.label}”</span>
        ) : null}
      </div>

      <ol className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, i) => {
          const active = run?.stepIndex === i;
          const done = run != null && (run.phase === "completed" || i < run.stepIndex);
          return (
            <li key={step.id} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold",
                  active && "bg-ink text-white",
                  done && !active && "bg-mustard/35 text-ink",
                  !active && !done && "bg-mist text-muted"
                )}
                title={`${step.durationDays}d · ${step.nextAction}`}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted" />
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="accent"
          disabled={run?.phase === "completed"}
          onClick={onAdvance}
        >
          <SkipForward className="h-4 w-4" /> Advance strategy
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={run?.phase === "completed"}
          onClick={() => onSimulate(1)}
        >
          <Clock className="h-4 w-4" /> +1 day
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={run?.phase === "completed"}
          onClick={() => onSimulate(7)}
        >
          <Play className="h-4 w-4" /> +7 days
        </Button>
      </div>

      {flash && (
        <p className="text-sm font-medium text-ink">{flash}</p>
      )}

      {run && run.events.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            Events
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted">
            {run.events.slice(0, 12).map((ev) => (
              <li key={ev.id} className="flex gap-2">
                <span className="shrink-0 tabular-nums text-ink/50">
                  {new Date(ev.simulatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>{ev.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
