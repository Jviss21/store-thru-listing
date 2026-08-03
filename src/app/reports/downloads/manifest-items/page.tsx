"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsManifestItems } from "@/lib/report-download-rows";

export default function ManifestItemsDownloadPage() {
  return (
    <DownloadReportPage
      reportType="manifest-items"
      title="Manifest / Intake Items Report"
      about="This report includes intake batch items created within a given date range."
      filenamePrefix="manifest-items"
      buildRows={({ start, end }) => rowsManifestItems(start, end)}
    />
  );
}
