"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import {
  EVENT_LOG_CHANGED,
  EVENT_SECTION_LABELS,
  getSectionEvents,
  type EventLogEntry,
  type EventSection,
} from "@/lib/event-log";
import { cn, relativeTime } from "@/lib/utils";

export function SectionEventLog({
  section,
  title,
  defaultOpen = true,
  limit = 12,
  className,
}: {
  section: EventSection;
  title?: string;
  defaultOpen?: boolean;
  limit?: number;
  className?: string;
}) {
  const { org } = useOrg();
  const [open, setOpen] = useState(defaultOpen);
  const [rows, setRows] = useState<EventLogEntry[]>([]);

  const refresh = useCallback(() => {
    setRows(getSectionEvents(section, org.id).slice(0, limit));
  }, [section, org.id, limit]);

  useEffect(() => {
    refresh();
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ orgId?: string }>).detail;
      if (detail?.orgId && detail.orgId !== org.id) return;
      refresh();
    }
    window.addEventListener(EVENT_LOG_CHANGED, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT_LOG_CHANGED, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh, org.id]);

  const heading = title ?? `${EVENT_SECTION_LABELS[section]} activity`;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-mist/40"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <span className="font-display text-sm font-bold text-ink">{heading}</span>
          <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
            Event log
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      {open && (
        <div className="border-t border-ink/8">
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-ink/8 bg-mist/50 text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-2 font-semibold">When</th>
                    <th className="px-3 py-2 font-semibold">User</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                    <th className="px-3 py-2 font-semibold">Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-ink/5 last:border-0 hover:bg-mist/30">
                      <td
                        className="whitespace-nowrap px-4 py-2.5 text-muted"
                        title={new Date(r.at).toLocaleString()}
                      >
                        {relativeTime(r.at)}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-ink">{r.user}</td>
                      <td className="px-3 py-2.5 text-ink/90">{r.action}</td>
                      <td className="px-3 py-2.5">
                        {r.resourceHref ? (
                          <Link
                            href={r.resourceHref}
                            className="font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {r.resource}
                          </Link>
                        ) : (
                          <span className="text-ink/80">{r.resource}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function SectionEventLogInline({
  section,
  limit = 5,
}: {
  section: EventSection;
  limit?: number;
}) {
  const { org } = useOrg();
  const rows = useMemo(
    () => getSectionEvents(section, org.id).slice(0, limit),
    [section, org.id, limit]
  );

  if (!rows.length) return null;

  return (
    <ul className="space-y-1.5 text-xs text-muted">
      {rows.map((r) => (
        <li key={r.id}>
          <span className="font-medium text-ink">{r.user}</span> · {r.action} · {r.resource}
        </li>
      ))}
    </ul>
  );
}
