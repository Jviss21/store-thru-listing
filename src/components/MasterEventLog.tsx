"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import {
  EVENT_LOG_CHANGED,
  EVENT_SECTION_LABELS,
  getMasterEvents,
  type EventLogEntry,
  type EventSection,
} from "@/lib/event-log";
import { downloadCsv, stamp } from "@/lib/download";
import { ORG_SLUG } from "@/lib/mock-data";
import { relativeTime } from "@/lib/utils";

const SECTIONS: Array<EventSection | "all"> = [
  "all",
  "products",
  "listings",
  "orders",
  "shipments",
  "manifests",
  "auto-list",
  "admin",
  "reports",
];

export function MasterEventLog({
  title = "Master event log",
  description = "Cross-system audit trail — Admin and Hammoq Ops only.",
}: {
  title?: string;
  description?: string;
}) {
  const { org } = useOrg();
  const [rows, setRows] = useState<EventLogEntry[]>([]);
  const [section, setSection] = useState<EventSection | "all">("all");
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRows(getMasterEvents(org.id));
  }, [org.id]);

  useEffect(() => {
    refresh();
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ orgId?: string }>).detail;
      if (detail?.orgId && detail.orgId !== org.id) return;
      refresh();
    }
    window.addEventListener(EVENT_LOG_CHANGED, onChange);
    return () => window.removeEventListener(EVENT_LOG_CHANGED, onChange);
  }, [refresh, org.id]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (section !== "all" && r.section !== section) return false;
      if (!q.trim()) return true;
      const hay = `${r.user} ${r.userName ?? ""} ${r.action} ${r.resource} ${r.section}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [rows, section, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            downloadCsv(
              `${ORG_SLUG}-master-events-${stamp()}.csv`,
              filtered.map((r) => ({
                at: r.at,
                section: r.section,
                user: r.user,
                action: r.action,
                resource: r.resource,
              }))
            );
            setFlash("Master event log CSV downloaded.");
            setTimeout(() => setFlash(null), 2000);
          }}
        >
          Download CSV
        </Button>
      </div>

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          className="max-w-sm"
          placeholder="Search user, action, resource…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              className={
                section === s
                  ? "rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink/80"
              }
            >
              {s === "all" ? "All" : EVENT_SECTION_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">When</th>
              <th className="px-3 py-2.5 font-semibold">User</th>
              <th className="px-3 py-2.5 font-semibold">Section</th>
              <th className="px-3 py-2.5 font-semibold">Action</th>
              <th className="px-3 py-2.5 font-semibold">Resource</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-ink/5 hover:bg-mist/40">
                <td
                  className="whitespace-nowrap px-4 py-3 text-muted"
                  title={new Date(r.at).toLocaleString()}
                >
                  {relativeTime(r.at)}
                </td>
                <td className="px-3 py-3 font-medium">{r.user}</td>
                <td className="px-3 py-3">{EVENT_SECTION_LABELS[r.section]}</td>
                <td className="px-3 py-3">{r.action}</td>
                <td className="px-3 py-3">
                  {r.resourceHref ? (
                    <Link
                      href={r.resourceHref}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {r.resource}
                    </Link>
                  ) : (
                    r.resource
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted">No events match these filters.</p>
        )}
      </Card>
    </div>
  );
}
