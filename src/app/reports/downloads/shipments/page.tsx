"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsShipments } from "@/lib/report-download-rows";

export default function ShipmentsDownloadPage() {
  return (
    <DownloadReportPage
      reportType="shipments"
      title="Shipments Report"
      about="This report includes shipments created within a given date range."
      filenamePrefix="shipments"
      buildRows={({ start, end }) => rowsShipments(start, end)}
    />
  );
}
