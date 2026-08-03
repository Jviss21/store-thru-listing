"use client";

import { useMemo, useState } from "react";
import { ReportPageFrame, DataTable, Th, Td, TotalsRow } from "@/components/reports/ReportChrome";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import {
  PRODUCTIVITY_METRICS,
  buildUserProductivity,
  dashZero,
  sumMetrics,
} from "@/lib/report-mock-data";
import { formatNumber } from "@/lib/utils";

export default function UserProductivityPage() {
  const { range, setRange } = useReportRange("mtd");
  const { flash, setFlash } = useFlash();
  const [hideInactive, setHideInactive] = useState(true);

  const rows = useMemo(() => {
    const all = buildUserProductivity(range.start, range.end);
    return hideInactive ? all.filter((r) => r.active) : all;
  }, [range, hideInactive]);

  const totals = useMemo(() => sumMetrics(rows), [rows]);

  return (
    <ReportPageFrame>
      <AnalyticalReportHeader
        title="User productivity"
        description="Accepted, rejected, photographed, posted, shelved, purged, picked, packed, and shipped by teammate."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "user-productivity",
            rows.map((r) => ({
              user: r.user,
              active: r.active,
              ...Object.fromEntries(PRODUCTIVITY_METRICS.map((m) => [m, r[m]])),
            })),
            setFlash
          )
        }
        extraFilters={
          <label className="inline-flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink/20 accent-accent"
              checked={hideInactive}
              onChange={(e) => setHideInactive(e.target.checked)}
            />
            Hide inactive users
            <span className="text-muted">({rows.length} shown)</span>
          </label>
        }
      />

      <DataTable minWidth="1100px">
        <thead>
          <tr>
            <Th>User</Th>
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
            <tr key={r.user} className="hover:bg-mist/50">
              <Td className="font-medium text-ink">{r.user}</Td>
              {PRODUCTIVITY_METRICS.map((m) => {
                const v = dashZero(r[m]);
                return (
                  <Td key={m} align="right" className="text-ink/80">
                    {v == null ? "—" : formatNumber(v)}
                  </Td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </DataTable>
    </ReportPageFrame>
  );
}
