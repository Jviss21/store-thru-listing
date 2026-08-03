"use client";

import { useMemo, useState } from "react";
import { ReportPageFrame, DataTable, Th, Td, TotalsRow } from "@/components/reports/ReportChrome";
import { MultiSeriesChart } from "@/components/reports/ReportCharts";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import {
  PRODUCTIVITY_METRICS,
  REPORT_STAFF,
  buildOperationalDays,
  dashZero,
  sumMetrics,
} from "@/lib/report-mock-data";
import { formatDisplayDate } from "@/lib/report-dates";
import { formatNumber } from "@/lib/utils";

export default function OperationalProductivityPage() {
  const { range, setRange } = useReportRange("last_30");
  const { flash, setFlash } = useFlash();
  const [groupBy, setGroupBy] = useState("day");
  const [showing, setShowing] = useState("all");

  const rows = useMemo(() => buildOperationalDays(range.start, range.end), [range]);
  const totals = useMemo(() => sumMetrics(rows), [rows]);

  const chartSeries = useMemo(
    () =>
      rows.map((r) => ({
        date: r.date,
        values: Object.fromEntries(PRODUCTIVITY_METRICS.map((m) => [m, r[m]])) as Record<
          (typeof PRODUCTIVITY_METRICS)[number],
          number
        >,
      })),
    [rows]
  );

  return (
    <ReportPageFrame>
      <AnalyticalReportHeader
        title="Operational productivity"
        description="Pipeline throughput grouped by day — chart plus daily detail table."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "operational-productivity",
            rows.map((r) => ({
              date: r.date,
              ...Object.fromEntries(PRODUCTIVITY_METRICS.map((m) => [m, r[m]])),
            })),
            setFlash
          )
        }
        extraFilters={
          <div className="flex flex-wrap gap-3">
            <label className="block min-w-[140px]">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
                Group by
              </span>
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
              </select>
            </label>
            <label className="block min-w-[160px]">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
                Showing
              </span>
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
                value={showing}
                onChange={(e) => setShowing(e.target.value)}
              >
                <option value="all">All users</option>
                {REPORT_STAFF.filter((s) => s.active)
                  .slice(0, 20)
                  .map((s) => (
                    <option key={s.handle} value={s.handle}>
                      {s.handle}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        }
      />

      <MultiSeriesChart series={chartSeries} />

      <DataTable minWidth="1100px">
        <thead>
          <tr>
            <Th>Timeframe</Th>
            {PRODUCTIVITY_METRICS.map((m) => (
              <Th key={m} align="right" className="capitalize">
                {m}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          <TotalsRow>
            <Td>Totals</Td>
            {PRODUCTIVITY_METRICS.map((m) => (
              <Td key={m} align="right">
                {formatNumber(totals[m])}
              </Td>
            ))}
          </TotalsRow>
          {rows.map((r) => (
            <tr key={r.date} className="hover:bg-mist/50">
              <Td className="font-medium">{formatDisplayDate(r.date)}</Td>
              {PRODUCTIVITY_METRICS.map((m) => {
                const v = dashZero(r[m]);
                return (
                  <Td key={m} align="right">
                    {v == null ? "—" : formatNumber(v)}
                  </Td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </DataTable>
      {groupBy === "week" && (
        <p className="text-xs text-muted">Week grouping uses the same daily mock series in this demo.</p>
      )}
      {showing !== "all" && (
        <p className="text-xs text-muted">Filtered to {showing} (demo scale applied evenly).</p>
      )}
    </ReportPageFrame>
  );
}
