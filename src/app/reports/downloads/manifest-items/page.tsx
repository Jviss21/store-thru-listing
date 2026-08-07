"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsManifestItems } from "@/lib/report-download-rows";

export default function ManifestItemsDownloadPage() {
  return (
    <DownloadReportPage
      reportType="manifest-items"
      title="Donor Intake Items Report"
      about="This report includes Donor Item Creation batch items created within a given date range."
      filenamePrefix="donor-intake-items"
      buildRows={({ start, end }) => rowsManifestItems(start, end)}
    />
  );
}
