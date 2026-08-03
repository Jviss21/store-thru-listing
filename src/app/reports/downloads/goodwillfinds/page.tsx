"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";

export default function GoodwillfindsDownloadPage() {
  return (
    <DownloadReportPage
      reportType="goodwillfinds-listings"
      title="Goodwillfinds Listing Report"
      about="This report includes all Goodwillfinds listings created within a given date range."
      filenamePrefix="goodwillfinds-listings"
      buildRows={() => []}
      stub={{
        message:
          "Goodwillfinds is not enabled for Test Goodwill in this Hammoq demo. ShopGoodwill and eBay downloads are available instead.",
      }}
    />
  );
}
