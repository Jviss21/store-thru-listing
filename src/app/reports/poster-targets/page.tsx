"use client";

import { useMemo } from "react";
import { ReportPageFrame } from "@/components/reports/ReportChrome";
import { BarCompareChart } from "@/components/reports/ReportCharts";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import { REPORT_STAFF, buildPosterTargets } from "@/lib/report-mock-data";
import { useState } from "react";

export default function PosterTargetsPage() {
  const { range, setRange } = useReportRange("wtd");
  const { flash, setFlash } = useFlash();
  const [posterFilter, setPosterFilter] = useState("all");

  const rows = useMemo(() => {
    const all = buildPosterTargets(range.start, range.end);
    if (posterFilter === "all") return all;
    return all.filter((r) => r.poster === posterFilter);
  }, [range, posterFilter]);

  return (
    <ReportPageFrame>
      <AnalyticalReportHeader
        title="Poster targets"
        description="Actual postings compared to targets by poster."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "poster-targets",
            rows as unknown as Record<string, unknown>[],
            setFlash
          )
        }
        extraFilters={
          <label className="block max-w-xs">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
              Poster
            </span>
            <select
              className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
              value={posterFilter}
              onChange={(e) => setPosterFilter(e.target.value)}
            >
              <option value="all">All posters</option>
              {REPORT_STAFF.filter((s) => s.active)
                .slice(0, 40)
                .map((s) => (
                  <option key={s.handle} value={s.handle}>
                    {s.handle}
                  </option>
                ))}
            </select>
          </label>
        }
      />

      <BarCompareChart rows={rows} />
    </ReportPageFrame>
  );
}
