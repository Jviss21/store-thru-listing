"use client";

import { useMemo } from "react";
import { ReportPageFrame, DataTable, Th, Td, TotalsRow } from "@/components/reports/ReportChrome";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import { buildPosterOverview } from "@/lib/report-mock-data";
import { formatNumber } from "@/lib/utils";

export default function PosterOverviewPage() {
  const { range, setRange } = useReportRange("wtd");
  const { flash, setFlash } = useFlash();
  const rows = useMemo(() => buildPosterOverview(range.start, range.end), [range]);

  const totals = useMemo(
    () => ({
      postingsActual: rows.reduce((s, r) => s + r.postingsActual, 0),
      postingsTarget: rows.reduce((s, r) => s + r.postingsTarget, 0),
      totalHours: Math.round(rows.reduce((s, r) => s + r.totalHours, 0) * 100) / 100,
    }),
    [rows]
  );

  return (
    <ReportPageFrame>
      <AnalyticalReportHeader
        title="Poster overview"
        description="Postings actual vs target, hours worked, average %, and postings per hour."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "poster-overview",
            rows as unknown as Record<string, unknown>[],
            setFlash
          )
        }
      />

      <DataTable minWidth="980px">
        <thead>
          <tr>
            <Th>Date range</Th>
            <Th>Poster</Th>
            <Th align="right">Postings (actual)</Th>
            <Th align="right">Postings (target)</Th>
            <Th align="right">Total hours</Th>
            <Th align="right">Average %</Th>
            <Th align="right">Postings/hr (actual)</Th>
            <Th align="right">Postings/hr (target)</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.poster} className="hover:bg-mist/50">
              <Td className="text-muted">{r.dateRange}</Td>
              <Td className="font-medium text-ink">{r.poster}</Td>
              <Td align="right">{formatNumber(r.postingsActual)}</Td>
              <Td align="right">{formatNumber(r.postingsTarget)}</Td>
              <Td align="right">{r.totalHours.toFixed(2)}</Td>
              <Td align="right">{r.averagePct.toFixed(2)}%</Td>
              <Td align="right">{r.postingsPerHourActual.toFixed(2)}</Td>
              <Td align="right">{r.postingsPerHourTarget}</Td>
            </tr>
          ))}
          <TotalsRow>
            <Td colSpan={2}>Totals</Td>
            <Td align="right">{formatNumber(totals.postingsActual)}</Td>
            <Td align="right">{formatNumber(totals.postingsTarget)}</Td>
            <Td align="right">{totals.totalHours.toFixed(2)}</Td>
            <Td align="right">—</Td>
            <Td align="right">—</Td>
            <Td align="right">—</Td>
          </TotalsRow>
        </tbody>
      </DataTable>
    </ReportPageFrame>
  );
}
