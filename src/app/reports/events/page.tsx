"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ReportPageFrame, DataTable, Th, Td } from "@/components/reports/ReportChrome";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import { REPORT_STAFF, buildEventLogs } from "@/lib/report-mock-data";

export default function EventLogsPage() {
  const { range, setRange } = useReportRange("mtd");
  const { flash, setFlash } = useFlash();
  const [user, setUser] = useState("all");

  const rows = useMemo(() => {
    const all = buildEventLogs(range.start, range.end);
    return user === "all" ? all : all.filter((r) => r.user === user);
  }, [range, user]);

  return (
    <ReportPageFrame>
      <AnalyticalReportHeader
        title="Event logs"
        description="Audit trail with timestamp, resource, event, and IP."
        range={range}
        setRange={setRange}
        flash={flash}
        downloadLabel="Export"
        onDownload={() =>
          downloadReportRows(
            "event-logs",
            rows.map((r) => ({
              timestamp: r.timestamp,
              resource: r.resource,
              event: r.event,
              user: r.user,
              ip: r.ip,
            })),
            setFlash
          )
        }
        extraFilters={
          <label className="block max-w-xs">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
              User
            </span>
            <select
              className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            >
              <option value="all">All users</option>
              {REPORT_STAFF.slice(0, 60).map((s) => (
                <option key={s.handle} value={s.handle}>
                  {s.handle}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <DataTable minWidth="960px">
        <thead>
          <tr>
            <Th>Timestamp</Th>
            <Th>Resource</Th>
            <Th>Event</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.timestamp}-${i}`} className="hover:bg-mist/50">
              <Td mono className="text-muted whitespace-nowrap">
                {new Date(r.timestamp).toLocaleString()}
              </Td>
              <Td>
                <Link href={r.resourceHref} className="font-medium text-ink underline decoration-accent/60 underline-offset-2">
                  {r.resource}
                </Link>
              </Td>
              <Td>{r.event}</Td>
              <Td mono className="text-muted">
                {r.ip}
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </ReportPageFrame>
  );
}
