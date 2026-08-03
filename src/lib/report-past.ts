"use client";

import { ORG_SLUG } from "@/lib/mock-data";

export type PastReport = {
  id: string;
  reportType: string;
  createdBy: string;
  createdAt: string;
  status: "Complete";
  email: string;
  start: string;
  end: string;
  timezone: string;
  filename: string;
  /** CSV body for re-download */
  csv: string;
  filters?: Record<string, string>;
};

function storageKey(orgSlug: string, reportType: string) {
  return `hammoq-past-reports:${orgSlug}:${reportType}`;
}

export function loadPastReports(reportType: string, orgSlug = ORG_SLUG): PastReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(orgSlug, reportType));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PastReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePastReports(reportType: string, rows: PastReport[], orgSlug = ORG_SLUG) {
  localStorage.setItem(storageKey(orgSlug, reportType), JSON.stringify(rows.slice(0, 40)));
}

export function addPastReport(
  reportType: string,
  entry: Omit<PastReport, "id" | "status" | "createdAt" | "reportType"> & {
    createdAt?: string;
  },
  orgSlug = ORG_SLUG
): PastReport {
  const row: PastReport = {
    id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "Complete",
    createdAt: entry.createdAt ?? new Date().toISOString(),
    reportType,
    createdBy: entry.createdBy,
    email: entry.email,
    start: entry.start,
    end: entry.end,
    timezone: entry.timezone,
    filename: entry.filename,
    csv: entry.csv,
    filters: entry.filters,
  };
  const next = [row, ...loadPastReports(reportType, orgSlug)];
  savePastReports(reportType, next, orgSlug);
  return row;
}
