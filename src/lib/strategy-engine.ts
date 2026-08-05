/**
 * Listing strategy lifecycle runner — demo/cron-simulated advance.
 * Persists org-scoped runs in localStorage. Clear path to DB: mirror StrategyRun
 * onto Listing / Product rows (strategyId, stepIndex, simulatedAt, events JSON).
 */

import { DEFAULT_ORG_ID } from "@/lib/orgs";
import { loadSession } from "@/lib/session";
import { logEvent } from "@/lib/event-log";
import {
  cloneStrategies,
  ensureStrategySteps,
  getStrategyById,
  getStrategyByName,
  getStrategySteps,
  LISTING_STRATEGIES,
  type ListingStrategy,
  type StrategyStep,
} from "@/lib/listing-strategies";
import { loadAdminState } from "@/lib/admin-settings";
import type { Listing, ListingChannel, ListingStatus, ListingType } from "@/lib/types";

export const STRATEGY_RUNS_KEY_PREFIX = "stl-strategy-runs:";
export const STRATEGY_RUNS_CHANGED = "stl-strategy-runs-changed";

export type StrategyRunEvent = {
  id: string;
  at: string; // wall clock
  simulatedAt: string;
  type:
    | "assigned"
    | "advanced"
    | "simulated_time"
    | "price_change"
    | "status_change"
    | "channel_effect";
  message: string;
  stepId?: string;
  stepLabel?: string;
};

export type StrategyRunPhase = "queued" | "active" | "completed";

export type StrategyRun = {
  listingId: string;
  productId?: string;
  sku: string;
  strategyId: string;
  strategyName: string;
  stepIndex: number;
  phase: StrategyRunPhase;
  simulatedNow: string;
  stepEnteredAt: string;
  currentPrice: number;
  listingStatus: ListingStatus;
  listingType: ListingType;
  activeChannels: ListingChannel[];
  events: StrategyRunEvent[];
  updatedAt: string;
};

export type StrategyRunsState = {
  orgId: string;
  /** keyed by listingId */
  runs: Record<string, StrategyRun>;
};

function storageKey(orgId: string) {
  return `${STRATEGY_RUNS_KEY_PREFIX}${orgId || DEFAULT_ORG_ID}`;
}

function emitChanged(orgId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(STRATEGY_RUNS_CHANGED, { detail: { orgId } })
  );
}

function nowIso() {
  return new Date().toISOString();
}

function eventId() {
  return `se-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyRunsState(orgId: string): StrategyRunsState {
  return { orgId: orgId || DEFAULT_ORG_ID, runs: {} };
}

export function loadStrategyRuns(orgId: string): StrategyRunsState {
  if (typeof window === "undefined") return emptyRunsState(orgId);
  try {
    const raw = localStorage.getItem(storageKey(orgId));
    if (!raw) return emptyRunsState(orgId);
    const parsed = JSON.parse(raw) as StrategyRunsState;
    return {
      orgId: parsed.orgId || orgId,
      runs: parsed.runs && typeof parsed.runs === "object" ? parsed.runs : {},
    };
  } catch {
    return emptyRunsState(orgId);
  }
}

export function saveStrategyRuns(orgId: string, state: StrategyRunsState) {
  const next = { ...state, orgId: orgId || DEFAULT_ORG_ID };
  localStorage.setItem(storageKey(orgId), JSON.stringify(next));
  emitChanged(orgId);
  return next;
}

export function clearStrategyRuns(orgId?: string) {
  if (typeof window === "undefined") return;
  if (orgId) {
    localStorage.removeItem(storageKey(orgId));
    emitChanged(orgId);
    return;
  }
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(STRATEGY_RUNS_KEY_PREFIX)) localStorage.removeItem(k);
  }
}

/** Resolve strategy defs from Admin localStorage, falling back to seed. */
export function resolveOrgStrategies(orgId?: string): ListingStrategy[] {
  void orgId;
  if (typeof window === "undefined") {
    return LISTING_STRATEGIES.map(ensureStrategySteps);
  }
  const admin = loadAdminState();
  const list = admin.strategies?.length ? admin.strategies : [];
  if (!list.length) return cloneStrategies().map(ensureStrategySteps);
  return list.map(ensureStrategySteps);
}

export function resolveStrategy(
  nameOrId: string,
  orgId?: string
): ListingStrategy | undefined {
  const all = resolveOrgStrategies(orgId);
  return (
    all.find((s) => s.id === nameOrId || s.name === nameOrId) ??
    getStrategyById(nameOrId) ??
    getStrategyByName(nameOrId)
  );
}

function pushEvent(
  run: StrategyRun,
  partial: Omit<StrategyRunEvent, "id" | "at" | "simulatedAt"> & {
    simulatedAt?: string;
  }
): StrategyRun {
  const ev: StrategyRunEvent = {
    id: eventId(),
    at: nowIso(),
    simulatedAt: partial.simulatedAt ?? run.simulatedNow,
    type: partial.type,
    message: partial.message,
    stepId: partial.stepId,
    stepLabel: partial.stepLabel,
  };
  return { ...run, events: [ev, ...run.events].slice(0, 80), updatedAt: nowIso() };
}

function applyStepEffects(
  run: StrategyRun,
  step: StrategyStep,
  strategy: ListingStrategy
): StrategyRun {
  let next = { ...run };
  const prevStatus = next.listingStatus;
  const prevPrice = next.currentPrice;
  const prevChannels = next.activeChannels.join(",");

  next.listingStatus = step.targetStatus;
  if (step.listingType) next.listingType = step.listingType;
  next.activeChannels = [...step.channels];

  if (step.priceMode === "starting") {
    next.currentPrice = strategy.startingPrice;
  } else if (step.priceMode === "bin") {
    next.currentPrice =
      strategy.buyItNowPrice ?? strategy.startingPrice ?? next.currentPrice;
  } else if (step.priceMode === "reduce_pct" && step.priceValue != null) {
    const pct = Math.max(0, Math.min(90, step.priceValue));
    next.currentPrice =
      Math.round(next.currentPrice * (1 - pct / 100) * 100) / 100;
  }

  if (prevStatus !== next.listingStatus) {
    next = pushEvent(next, {
      type: "status_change",
      message: `Status ${prevStatus} → ${next.listingStatus} (simulated)`,
      stepId: step.id,
      stepLabel: step.label,
    });
  }
  if (prevPrice !== next.currentPrice) {
    next = pushEvent(next, {
      type: "price_change",
      message: `Price $${prevPrice.toFixed(2)} → $${next.currentPrice.toFixed(2)} (simulated)`,
      stepId: step.id,
      stepLabel: step.label,
    });
  }
  if (prevChannels !== next.activeChannels.join(",")) {
    next = pushEvent(next, {
      type: "channel_effect",
      message: next.activeChannels.length
        ? `Channels: ${next.activeChannels.join(" + ")} (simulated)`
        : "Channels cleared for purge (simulated)",
      stepId: step.id,
      stepLabel: step.label,
    });
  }

  return next;
}

export function currentStep(run: StrategyRun, strategy: ListingStrategy): StrategyStep | null {
  const steps = getStrategySteps(strategy);
  return steps[run.stepIndex] ?? null;
}

export function nextStep(run: StrategyRun, strategy: ListingStrategy): StrategyStep | null {
  const steps = getStrategySteps(strategy);
  return steps[run.stepIndex + 1] ?? null;
}

export function getRunForListing(
  orgId: string,
  listingId: string
): StrategyRun | null {
  return loadStrategyRuns(orgId).runs[listingId] ?? null;
}

export type AssignStrategyInput = {
  orgId: string;
  listing: Pick<Listing, "id" | "productId" | "sku" | "strategy" | "price" | "status" | "listingType" | "channel">;
  strategyNameOrId?: string;
};

export function assignStrategyToListing(input: AssignStrategyInput): StrategyRun {
  const orgId = input.orgId || DEFAULT_ORG_ID;
  const strategy =
    resolveStrategy(input.strategyNameOrId ?? input.listing.strategy, orgId) ??
    resolveOrgStrategies(orgId)[0];
  if (!strategy) {
    throw new Error("No listing strategies available");
  }
  const steps = getStrategySteps(strategy);
  const first = steps[0]!;
  const simulatedNow = nowIso();
  let run: StrategyRun = {
    listingId: input.listing.id,
    productId: input.listing.productId,
    sku: input.listing.sku,
    strategyId: strategy.id,
    strategyName: strategy.name,
    stepIndex: 0,
    phase: first.kind === "queued" ? "queued" : "active",
    simulatedNow,
    stepEnteredAt: simulatedNow,
    currentPrice: input.listing.price || strategy.startingPrice,
    listingStatus: input.listing.status,
    listingType: input.listing.listingType ?? strategy.listingType,
    activeChannels: [input.listing.channel],
    events: [],
    updatedAt: nowIso(),
  };
  run = applyStepEffects(run, first, strategy);
  run = pushEvent(run, {
    type: "assigned",
    message: `Assigned strategy “${strategy.name}” · step “${first.label}”`,
    stepId: first.id,
    stepLabel: first.label,
  });

  const state = loadStrategyRuns(orgId);
  state.runs[run.listingId] = run;
  saveStrategyRuns(orgId, state);

  const session = loadSession();
  logEvent({
    section: "listings",
    action: `Assigned strategy · ${first.label}`,
    resource: `Listing ${run.sku}`,
    resourceHref: `/listings/${run.listingId}`,
    user: session.handle || undefined,
    userName: session.name || undefined,
    orgId,
  });

  return run;
}

export function ensureRunForListing(input: AssignStrategyInput): StrategyRun {
  const existing = getRunForListing(input.orgId, input.listing.id);
  if (existing) {
    const strategyName = input.strategyNameOrId ?? input.listing.strategy;
    if (
      strategyName &&
      existing.strategyName !== strategyName &&
      existing.strategyId !== strategyName
    ) {
      return assignStrategyToListing(input);
    }
    return existing;
  }
  return assignStrategyToListing(input);
}

/** Advance one lifecycle step (demo runner — no live marketplace). */
export function advanceStrategy(
  orgId: string,
  listingId: string
): { run: StrategyRun; message: string } | null {
  const state = loadStrategyRuns(orgId);
  const run = state.runs[listingId];
  if (!run) return null;
  if (run.phase === "completed") {
    return { run, message: "Lifecycle already complete." };
  }

  const strategy = resolveStrategy(run.strategyId, orgId) ?? resolveStrategy(run.strategyName, orgId);
  if (!strategy) return { run, message: "Strategy definition missing." };

  const steps = getStrategySteps(strategy);
  const cur = steps[run.stepIndex];
  const nxt = steps[run.stepIndex + 1];
  if (!nxt) {
    let done: StrategyRun = { ...run, phase: "completed", updatedAt: nowIso() };
    done = pushEvent(done, {
      type: "advanced",
      message: `Completed lifecycle at “${cur?.label ?? "end"}”`,
      stepId: cur?.id,
      stepLabel: cur?.label,
    });
    state.runs[listingId] = done;
    saveStrategyRuns(orgId, state);
    return { run: done, message: "Lifecycle complete." };
  }

  let nextRun: StrategyRun = {
    ...run,
    stepIndex: run.stepIndex + 1,
    phase: nxt.kind === "purge" && !steps[run.stepIndex + 2] ? "active" : "active",
    stepEnteredAt: run.simulatedNow,
    updatedAt: nowIso(),
  };
  if (nxt.kind === "queued") nextRun.phase = "queued";
  nextRun = applyStepEffects(nextRun, nxt, strategy);
  nextRun = pushEvent(nextRun, {
    type: "advanced",
    message: `Advanced ${cur?.label ?? "?"} → ${nxt.label}`,
    stepId: nxt.id,
    stepLabel: nxt.label,
  });

  if (nxt.kind === "purge") {
    nextRun = { ...nextRun, phase: "completed" };
    nextRun = pushEvent(nextRun, {
      type: "advanced",
      message: "Purge applied — lifecycle complete (simulated)",
      stepId: nxt.id,
      stepLabel: nxt.label,
    });
  }

  state.runs[listingId] = nextRun;
  saveStrategyRuns(orgId, state);

  const session = loadSession();
  logEvent({
    section: "listings",
    action: `Strategy advanced · ${nxt.label}`,
    resource: `Listing ${nextRun.sku}`,
    resourceHref: `/listings/${listingId}`,
    user: session.handle || undefined,
    userName: session.name || undefined,
    orgId,
  });

  return {
    run: nextRun,
    message: `Moved to “${nxt.label}”. Next: ${nxt.nextAction}`,
  };
}

/** Simulate N days of cron time; auto-advances when step duration elapses. */
export function simulateStrategyDays(
  orgId: string,
  listingId: string,
  days: number
): { run: StrategyRun; advanced: number; message: string } | null {
  const state = loadStrategyRuns(orgId);
  let run = state.runs[listingId];
  if (!run) return null;

  const strategy = resolveStrategy(run.strategyId, orgId) ?? resolveStrategy(run.strategyName, orgId);
  if (!strategy) return { run, advanced: 0, message: "Strategy definition missing." };

  const ms = Math.max(0, days) * 86400000;
  const nextSim = new Date(new Date(run.simulatedNow).getTime() + ms).toISOString();
  run = {
    ...run,
    simulatedNow: nextSim,
    updatedAt: nowIso(),
  };
  run = pushEvent(run, {
    type: "simulated_time",
    message: `Simulated +${days} day(s)`,
    simulatedAt: nextSim,
  });

  let advanced = 0;
  // Auto-advance while duration exceeded (cap loops)
  for (let guard = 0; guard < 12; guard++) {
    if (run.phase === "completed") break;
    const steps = getStrategySteps(strategy);
    const cur = steps[run.stepIndex];
    if (!cur) break;
    const elapsedMs =
      new Date(run.simulatedNow).getTime() - new Date(run.stepEnteredAt).getTime();
    const needMs = Math.max(0, cur.durationDays) * 86400000;
    if (cur.durationDays <= 0 && cur.kind === "queued") {
      // Queued with 0 days → ready to publish; require explicit or immediate advance once
      const result = advanceStrategy(orgId, listingId);
      if (!result || result.run.stepIndex === run.stepIndex) break;
      run = result.run;
      advanced += 1;
      continue;
    }
    if (needMs > 0 && elapsedMs >= needMs) {
      state.runs[listingId] = run;
      saveStrategyRuns(orgId, state);
      const result = advanceStrategy(orgId, listingId);
      if (!result || result.run.stepIndex === run.stepIndex) break;
      run = result.run;
      advanced += 1;
      continue;
    }
    break;
  }

  state.runs[listingId] = run;
  saveStrategyRuns(orgId, state);

  return {
    run,
    advanced,
    message:
      advanced > 0
        ? `Simulated +${days}d · auto-advanced ${advanced} step(s)`
        : `Simulated +${days}d · still on current step`,
  };
}

export function describeNextAction(
  run: StrategyRun | null,
  strategy: ListingStrategy | null
): string {
  if (!run || !strategy) return "Assign a strategy to begin the lifecycle.";
  if (run.phase === "completed") return "Lifecycle complete — no further action.";
  const cur = currentStep(run, strategy);
  return cur?.nextAction ?? "Advance to the next strategy step.";
}
