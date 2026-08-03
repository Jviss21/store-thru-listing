"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsRefunds } from "@/lib/report-download-rows";

export default function RefundsDownloadPage() {
  return (
    <DownloadReportPage
      reportType="refunds"
      title="Refunds Report"
      about="This report includes refunded orders within a given date range."
      filenamePrefix="refunds"
      buildRows={({ start, end }) => rowsRefunds(start, end)}
    />
  );
}
