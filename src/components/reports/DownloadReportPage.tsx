"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, PageHeader } from "@/components/ui";
import {
  AboutCard,
  DataTable,
  FilterCard,
  ReportBreadcrumb,
  ReportFlash,
  ReportPageFrame,
  Td,
  Th,
} from "@/components/reports/ReportChrome";
import { DatePresetBar } from "@/components/reports/DatePresetBar";
import { TIMEZONES } from "@/lib/report-catalog";
import { rangeForPreset, type DatePresetId } from "@/lib/report-dates";
import { addPastReport, loadPastReports, type PastReport } from "@/lib/report-past";
import { CURRENT_USER, ORG_NAME, ORG_SLUG } from "@/lib/mock-data";
import { downloadText, stamp, toCsv } from "@/lib/download";
import { relativeTime } from "@/lib/utils";

export type DownloadFilterField = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  hint?: string;
};

export function DownloadReportPage({
  reportType,
  title,
  about,
  filenamePrefix,
  buildRows,
  extraFilters = [],
  timezoneHint = "Use America/Los_Angeles for SGW where relevant.",
  defaultTimezone = "America/Denver",
  stub,
}: {
  reportType: string;
  title: string;
  about: string;
  filenamePrefix: string;
  buildRows: (ctx: {
    start: string;
    end: string;
    timezone: string;
    filters: Record<string, string>;
  }) => Record<string, unknown>[];
  extraFilters?: DownloadFilterField[];
  timezoneHint?: string;
  defaultTimezone?: string;
  stub?: { message: string };
}) {
  const initial = rangeForPreset("mtd");
  const [range, setRange] = useState<{
    start: string;
    end: string;
    preset: DatePresetId | "custom";
  }>({ ...initial, preset: "mtd" });
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [email, setEmail] = useState(CURRENT_USER.email);
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(extraFilters.map((f) => [f.id, f.defaultValue ?? f.options[0]?.value ?? ""]))
  );
  const [past, setPast] = useState<PastReport[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPast(loadPastReports(reportType));
  }, [reportType]);

  const canGenerate = useMemo(() => {
    if (stub) return false;
    return Boolean(email.trim() && range.start && range.end && range.start <= range.end);
  }, [email, range, stub]);

  function generate() {
    if (!canGenerate) return;
    setBusy(true);
    const rows = buildRows({
      start: range.start,
      end: range.end,
      timezone,
      filters,
    });
    const filename = `${ORG_SLUG}-${filenamePrefix}-${stamp()}.csv`;
    const csv = toCsv(rows);
    downloadText(filename, csv, "text/csv;charset=utf-8");
    const entry = addPastReport(reportType, {
      createdBy: CURRENT_USER.handle,
      email: email.trim(),
      start: range.start,
      end: range.end,
      timezone,
      filename,
      csv,
      filters,
    });
    setPast(loadPastReports(reportType));
    setFlash(
      `Report ready — emailed to ${entry.email} (demo) and downloaded as ${filename}.`
    );
    setTimeout(() => setFlash(null), 4500);
    setBusy(false);
  }

  function redownload(row: PastReport) {
    downloadText(row.filename, row.csv, "text/csv;charset=utf-8");
    setFlash(`Re-downloaded ${row.filename}.`);
    setTimeout(() => setFlash(null), 2500);
  }

  return (
    <ReportPageFrame>
      <ReportBreadcrumb
        crumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Downloads", href: "/reports/downloads" },
          { label: title },
        ]}
      />
      <PageHeader
        title={title}
        description={`Generate a CSV for ${ORG_NAME}. We'll email it when ready (demo completes instantly).`}
      />
      <AboutCard>{about}</AboutCard>
      <ReportFlash message={flash} />

      {stub ? (
        <FilterCard title="Not available">
          <p className="text-sm text-muted">{stub.message}</p>
        </FilterCard>
      ) : (
        <FilterCard
          title="Generate report for dates"
          actions={
            <div className="w-full space-y-2">
              <Button
                type="button"
                variant="accent"
                disabled={!canGenerate || busy}
                onClick={generate}
              >
                {busy ? "Generating…" : "Generate report"}
              </Button>
              <p className="text-xs text-muted">
                We&apos;ll email the report when it&apos;s ready.
              </p>
            </div>
          }
        >
          <DatePresetBar value={range} onChange={setRange} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
                Timezone
              </span>
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-muted">{timezoneHint}</span>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
                Email report to
              </span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
          </div>

          {extraFilters.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {extraFilters.map((f) => (
                <label key={f.id} className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
                    {f.label}
                  </span>
                  <select
                    className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40"
                    value={filters[f.id] ?? ""}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, [f.id]: e.target.value }))
                    }
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {f.hint && <span className="mt-1 block text-[11px] text-muted">{f.hint}</span>}
                </label>
              ))}
            </div>
          )}
        </FilterCard>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">Past reports</h2>
        {past.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 bg-white/50 px-4 py-8 text-center text-sm text-muted">
            No recent reports
          </p>
        ) : (
          <DataTable minWidth="640px">
            <thead>
              <tr>
                <Th>Created by</Th>
                <Th>Created</Th>
                <Th>Status</Th>
                <Th>Link</Th>
              </tr>
            </thead>
            <tbody>
              {past.map((row) => (
                <tr key={row.id} className="hover:bg-mist/40">
                  <Td className="font-medium">{row.createdBy}</Td>
                  <Td className="text-muted">{relativeTime(row.createdAt)}</Td>
                  <Td>
                    <span className="inline-flex rounded-full bg-mustard/25 px-2.5 py-0.5 text-xs font-semibold text-ink">
                      {row.status}
                    </span>
                  </Td>
                  <Td>
                    <button
                      type="button"
                      className="font-semibold text-ink underline decoration-accent underline-offset-2 hover:text-ink/80"
                      onClick={() => redownload(row)}
                    >
                      Download
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </div>
    </ReportPageFrame>
  );
}
