"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  Building2,
  Crosshair,
  RefreshCw,
  Shield,
  ToggleLeft,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import type { OrgHealth, SyncError } from "@/lib/api";
import { getOrgById, type OrgSyncStatus } from "@/lib/orgs";
import { OPS_EMAIL } from "@/lib/db/seed-data";
import { cn, relativeTime } from "@/lib/utils";
import { logEvent } from "@/lib/event-log";

const IMPERSONATE_KEY = "stl-ops-impersonating";

type ImpersonationState = {
  targetOrgId: string;
  previousOrgId: string;
  startedAt: string;
};

function readImpersonation(): ImpersonationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(IMPERSONATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImpersonationState;
  } catch {
    return null;
  }
}

function writeImpersonation(state: ImpersonationState | null) {
  if (typeof window === "undefined") return;
  if (!state) sessionStorage.removeItem(IMPERSONATE_KEY);
  else sessionStorage.setItem(IMPERSONATE_KEY, JSON.stringify(state));
}

function statusTone(s: OrgSyncStatus): "green" | "orange" | "red" | "neutral" {
  if (s === "healthy") return "green";
  if (s === "degraded") return "orange";
  if (s === "paused") return "neutral";
  return "red";
}

export default function OpsConsolePage() {
  const router = useRouter();
  const { update } = useSession();
  const { hydrated, session, isOps, setActiveOrgId, api, org } = useOrg();
  const [health, setHealth] = useState<OrgHealth[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<SyncError[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [dbMode, setDbMode] = useState<string>("");
  const [impersonating, setImpersonating] = useState<ImpersonationState | null>(null);

  const reload = useCallback(async () => {
    const res = await api.ops.listOrgHealth();
    if (res.ok) setHealth(res.data);
  }, [api]);

  useEffect(() => {
    if (!hydrated || !isOps) return;
    void reload();
    setImpersonating(readImpersonation());
    void fetch("/api/me")
      .then((r) => r.json())
      .then((j) => {
        if (j?.dbMode) setDbMode(j.dbMode);
      })
      .catch(() => undefined);
  }, [hydrated, isOps, reload]);

  useEffect(() => {
    if (!selectedId || !isOps) {
      setErrors([]);
      return;
    }
    void api.ops.recentErrors(selectedId).then((res) => {
      if (res.ok) setErrors(res.data);
    });
  }, [selectedId, isOps, api]);

  async function impersonate(orgId: string) {
    const previousOrgId = session.activeOrgId || org.id;
    setActiveOrgId(orgId);
    await update({ orgId });
    await fetch("/api/ops/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    });
    const name = getOrgById(orgId)?.name ?? "org";
    const state: ImpersonationState = {
      targetOrgId: orgId,
      previousOrgId,
      startedAt: new Date().toISOString(),
    };
    writeImpersonation(state);
    setImpersonating(state);
    logEvent({
      section: "auth",
      action: "Impersonation started",
      resource: name,
      resourceHref: "/ops",
      entityId: orgId,
      detail: `From ${getOrgById(previousOrgId)?.name ?? previousOrgId}`,
      orgId,
      user: session.handle || "ops",
      userName: session.name || undefined,
    });
    setFlash(`Impersonating ${name} — routing to home.`);
    setTimeout(() => router.push("/"), 400);
  }

  async function endImpersonation() {
    const current = readImpersonation();
    const restoreOrgId = current?.previousOrgId || session.membershipOrgIds[0] || org.id;
    const endedOrgId = current?.targetOrgId || session.activeOrgId;
    setActiveOrgId(restoreOrgId);
    await update({ orgId: restoreOrgId });
    await fetch("/api/ops/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ end: true, orgId: endedOrgId, previousOrgId: restoreOrgId }),
    });
    writeImpersonation(null);
    setImpersonating(null);
    logEvent({
      section: "auth",
      action: "Impersonation ended",
      resource: getOrgById(endedOrgId)?.name ?? endedOrgId,
      resourceHref: "/ops",
      entityId: endedOrgId,
      detail: `Restored ${getOrgById(restoreOrgId)?.name ?? restoreOrgId}`,
      orgId: restoreOrgId,
      user: session.handle || "ops",
      userName: session.name || undefined,
    });
    setFlash("Impersonation ended.");
    setTimeout(() => setFlash(null), 2000);
  }

  async function toggleFlag(
    orgId: string,
    key: "autoList" | "shopgoodwill" | "ebay" | "killSwitchOff",
    value: boolean
  ) {
    const res = await api.ops.setFlags(orgId, { [key]: value });
    if (res.ok) {
      await reload();
      setFlash("Feature flags saved (demo persist).");
      setTimeout(() => setFlash(null), 2000);
    }
  }

  async function forceSync(orgId: string) {
    const res = await api.ops.forceSync(orgId);
    if (res.ok) {
      await reload();
      setFlash("Force sync stub completed.");
      setTimeout(() => setFlash(null), 2000);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist text-sm text-muted">
        Loading Ops…
      </div>
    );
  }

  if (!isOps) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,180,41,0.12),transparent),linear-gradient(180deg,#0d1b34_0%,#162a4a_100%)] px-4">
        <Card className="w-full max-w-md space-y-4 p-8">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <h1 className="font-display text-xl font-bold text-ink">Hammoq Ops</h1>
          </div>
          <p className="text-sm text-muted">
            Staff console for the 10-org pilot. Sign in as{" "}
            <span className="font-mono text-xs text-ink">{OPS_EMAIL}</span> to continue.
          </p>
          <p className="text-xs text-muted">
            Current session: {session.email || "—"} · active org {org.name}
          </p>
          <Link href={`/login?next=${encodeURIComponent("/ops")}&ops=1`}>
            <Button className="w-full">Sign in as Ops</Button>
          </Link>
          <Link href="/" className="block text-center text-sm font-semibold text-muted hover:text-ink">
            ← Back to customer app
          </Link>
        </Card>
      </div>
    );
  }

  const selected = health.find((h) => h.orgId === selectedId) ?? null;
  const selectedOrg = selectedId ? getOrgById(selectedId) : null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f7fb_0%,#eef2f8_100%)]">
      <header className="border-b border-ink/10 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <Shield className="h-5 w-5 text-accent" />
          <div>
            <p className="font-display text-lg font-bold tracking-tight">Hammoq Ops</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
              Pilot console · not customer Admin
              {dbMode ? ` · db: ${dbMode}` : ""}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Badge tone="yellow">Staff</Badge>
            <span className="text-xs text-white/60">{session.email}</span>
            {impersonating ? (
              <Button
                type="button"
                size="sm"
                variant="accent"
                onClick={() => void endImpersonation()}
              >
                End impersonation
                {getOrgById(impersonating.targetOrgId)
                  ? ` · ${getOrgById(impersonating.targetOrgId)!.name}`
                  : ""}
              </Button>
            ) : null}
            <Link
              href="/"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              Customer app
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        {flash && (
          <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
            {flash}
          </div>
        )}

        <div>
          <h2 className="font-display text-2xl font-bold text-ink">10 pilot organizations</h2>
          <p className="mt-1 text-sm text-muted">
            Health, Auto-List volume, kill switches, and impersonation. Org list from auth
            memberships; product/listing data still mock until marketplace APIs land.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-ink/8 bg-white/80 shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-mist/60 text-[11px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">Organization</th>
                <th className="px-4 py-3 font-bold">Sync</th>
                <th className="px-4 py-3 font-bold">Errors</th>
                <th className="px-4 py-3 font-bold">Auto-List</th>
                <th className="px-4 py-3 font-bold">Flags</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {health.map((h) => {
                const o = getOrgById(h.orgId);
                if (!o) return null;
                return (
                  <tr
                    key={h.orgId}
                    className={cn(
                      "border-b border-ink/5 hover:bg-mist/40",
                      selectedId === h.orgId && "bg-accent/10"
                    )}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => setSelectedId(h.orgId)}
                      >
                        <p className="font-semibold text-ink">{o.name}</p>
                        <p className="text-[11px] text-muted">
                          {o.region} · {o.type}
                        </p>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(h.syncStatus)}>{h.syncStatus}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink">{h.errorCount}</td>
                    <td className="px-4 py-3 tabular-nums text-ink">
                      {h.autoListVolumeToday}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {!h.flags.killSwitchOff && (
                          <Badge tone="red">killed</Badge>
                        )}
                        {!h.flags.autoList && <Badge tone="orange">no AL</Badge>}
                        {!h.flags.shopgoodwill && <Badge tone="neutral">no SGW</Badge>}
                        {!h.flags.ebay && <Badge tone="neutral">no eBay</Badge>}
                        {h.flags.killSwitchOff &&
                          h.flags.autoList &&
                          h.flags.shopgoodwill &&
                          h.flags.ebay && (
                            <span className="text-[11px] text-muted">all on</span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="accent"
                          onClick={() => void impersonate(h.orgId)}
                        >
                          <Crosshair className="h-3 w-3" /> Open
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void forceSync(h.orgId)}
                        >
                          <RefreshCw className="h-3 w-3" /> Sync
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selected && selectedOrg && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <ToggleLeft className="h-4 w-4 text-muted" />
                <h3 className="font-display text-lg font-bold text-ink">
                  Flags · {selectedOrg.name}
                </h3>
              </div>
              {(
                [
                  ["killSwitchOff", "Kill switch off (allow sync / Auto-List)"],
                  ["autoList", "Auto-List enabled"],
                  ["shopgoodwill", "ShopGoodwill channel"],
                  ["ebay", "eBay channel"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-semibold text-ink">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(selected.flags[key])}
                    onChange={(e) => void toggleFlag(selected.orgId, key, e.target.checked)}
                  />
                </label>
              ))}
              <p className="text-xs text-muted">
                Last force sync:{" "}
                {selected.lastForceSyncAt
                  ? relativeTime(selected.lastForceSyncAt)
                  : "never"}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void impersonate(selected.orgId)}
              >
                <Building2 className="h-3.5 w-3.5" />
                Impersonate & go home
              </Button>
            </Card>

            <Card className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-coral" />
                <h3 className="font-display text-lg font-bold text-ink">Recent errors</h3>
              </div>
              {errors.length === 0 ? (
                <p className="text-sm text-muted">No recent errors.</p>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
                  {errors.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-lg border border-ink/8 bg-mist/40 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-muted">{e.sku}</span>
                        <Badge tone={e.severity === "error" ? "red" : "orange"}>
                          {e.channel}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink/80">{e.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {relativeTime(e.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
