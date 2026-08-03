"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { loadAdminState, saveAdminState, type AdminPersistedState } from "@/lib/admin-settings";
import { relativeTime } from "@/lib/utils";

const STATUS_CYCLE = ["Online", "Offline", "Maintenance"] as const;

export default function AdminStationsPage() {
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

  function cycleStatus(id: string) {
    if (!state) return;
    persist(
      {
        ...state,
        stations: state.stations.map((s) => {
          if (s.id !== id) return s;
          const idx = STATUS_CYCLE.indexOf(s.status);
          const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]!;
          return { ...s, status: next, lastSeenAt: new Date().toISOString() };
        }),
      },
      "Station status updated."
    );
  }

  if (!state) {
    return <p className="text-sm text-muted">Loading stations…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Printers & stations</h2>
          <p className="mt-1 text-sm text-muted">
            Label printers, photo bays, and scanners tied to warehouse locations.
          </p>
        </div>
        <Link href="/settings/printer">
          <Button variant="outline" type="button" size="sm">
            Open printer settings
          </Button>
        </Link>
      </div>

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Device</th>
              <th className="px-3 py-2.5 font-semibold">Kind</th>
              <th className="px-3 py-2.5 font-semibold">Location</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Last seen</th>
              <th className="px-4 py-2.5 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {state.stations.map((s) => (
              <tr key={s.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{s.name}</p>
                  <p className="text-xs text-muted">{s.detail}</p>
                </td>
                <td className="px-3 py-3">{s.kind}</td>
                <td className="px-3 py-3 text-muted">{s.location}</td>
                <td className="px-3 py-3">
                  <Badge
                    tone={
                      s.status === "Online" ? "green" : s.status === "Maintenance" ? "orange" : "red"
                    }
                  >
                    {s.status}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-muted">{relativeTime(s.lastSeenAt)}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" type="button" onClick={() => cycleStatus(s.id)}>
                    Cycle status
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
