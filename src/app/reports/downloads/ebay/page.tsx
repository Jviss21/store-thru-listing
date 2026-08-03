"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsEbayListings } from "@/lib/report-download-rows";

export default function EbayDownloadPage() {
  return (
    <DownloadReportPage
      reportType="ebay-listings"
      title="eBay Listing Report"
      about="This report includes all eBay listings created within a given date range."
      filenamePrefix="ebay-listings"
      buildRows={({ start, end }) => rowsEbayListings(start, end)}
    />
  );
}
