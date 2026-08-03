"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsAutoListQueue } from "@/lib/report-download-rows";
import { BRAND } from "@/lib/mock-data";

export default function AutoListDownloadPage() {
  return (
    <DownloadReportPage
      reportType="auto-list-queue"
      title={`${BRAND.autoList} Queue Report`}
      about={`This report includes the current ${BRAND.ai} ${BRAND.autoList} queue snapshot for Test Goodwill.`}
      filenamePrefix="auto-list-queue"
      buildRows={() => rowsAutoListQueue()}
    />
  );
}
