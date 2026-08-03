"use client";

import { useMemo, useState } from "react";
import { Button, PageHeader } from "@/components/ui";
import { DatePresetBar } from "@/components/reports/DatePresetBar";
import {
  AboutCard,
  FilterCard,
  ReportBreadcrumb,
  ReportFlash,
} from "@/components/reports/ReportChrome";
import { rangeForPreset, type DatePresetId } from "@/lib/report-dates";
import { downloadCsv, stamp } from "@/lib/download";
import { ORG_NAME, ORG_SLUG } from "@/lib/mock-data";
import { logEvent } from "@/lib/event-log";

export function useReportRange(defaultPreset: DatePresetId = "mtd") {
  const initial = rangeForPreset(defaultPreset);
  const [range, setRange] = useState<{
    start: string;
    end: string;
    preset: DatePresetId | "custom";
  }>({ ...initial, preset: defaultPreset });
  return { range, setRange };
}

export function AnalyticalReportHeader({
  title,
  description,
  about,
  range,
  setRange,
  onDownload,
  downloadLabel = "Download",
  extraFilters,
  flash,
}: {
  title: string;
  description?: string;
  about?: string;
  range: { start: string; end: string; preset: DatePresetId | "custom" };
  setRange: (v: { start: string; end: string; preset: DatePresetId | "custom" }) => void;
  onDownload: () => void;
  downloadLabel?: string;
  extraFilters?: React.ReactNode;
  flash?: string | null;
}) {
  return (
    <>
      <ReportBreadcrumb crumbs={[{ label: "Reports", href: "/reports" }, { label: title }]} />
      <PageHeader title={title} description={description ?? `In-app reporting for ${ORG_NAME}.`} />
      {about && <AboutCard>{about}</AboutCard>}
      <ReportFlash message={flash ?? null} />
      <FilterCard
        title="Date range"
        actions={
          <Button type="button" variant="accent" onClick={onDownload}>
            {downloadLabel}
          </Button>
        }
      >
        <DatePresetBar value={range} onChange={setRange} />
        {extraFilters}
      </FilterCard>
    </>
  );
}

export function downloadReportRows(
  prefix: string,
  rows: Record<string, unknown>[],
  setFlash: (msg: string | null) => void
) {
  downloadCsv(`${ORG_SLUG}-${prefix}-${stamp()}.csv`, rows);
  logEvent({
    section: "reports",
    action: `Downloaded ${prefix} CSV`,
    resource: prefix,
    resourceHref: "/reports",
  });
  setFlash(`${prefix} CSV downloaded.`);
  setTimeout(() => setFlash(null), 2500);
}

export function useFlash() {
  const [flash, setFlash] = useState<string | null>(null);
  return useMemo(() => ({ flash, setFlash }), [flash]);
}
