"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsProducts } from "@/lib/report-download-rows";

export default function ProductsDownloadPage() {
  return (
    <DownloadReportPage
      reportType="products"
      title="Products Report"
      about="This report includes products created within a given date range."
      filenamePrefix="products"
      buildRows={({ start, end }) => rowsProducts(start, end)}
    />
  );
}
