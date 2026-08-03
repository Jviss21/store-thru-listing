"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsShopgoodwillListings } from "@/lib/report-download-rows";

export default function ShopgoodwillDownloadPage() {
  return (
    <DownloadReportPage
      reportType="shopgoodwill-listings"
      title="ShopGoodwill Listing Report"
      about="This report includes all ShopGoodwill listings created within a given date range."
      filenamePrefix="shopgoodwill-listings"
      defaultTimezone="America/Los_Angeles"
      timezoneHint="America/Los_Angeles recommended for ShopGoodwill."
      buildRows={({ start, end }) => rowsShopgoodwillListings(start, end)}
    />
  );
}
