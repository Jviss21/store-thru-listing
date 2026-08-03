"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsOrders } from "@/lib/report-download-rows";

export default function PaidOrdersDownloadPage() {
  return (
    <DownloadReportPage
      reportType="paid-orders"
      title="Paid Orders Report"
      about="This report includes all orders marked paid within a given date range. Optionally filter by channel."
      filenamePrefix="paid-orders"
      extraFilters={[
        {
          id: "channel",
          label: "Channel",
          defaultValue: "All",
          options: [
            { value: "All", label: "All" },
            { value: "ShopGoodwill", label: "ShopGoodwill" },
            { value: "eBay", label: "eBay" },
          ],
        },
      ]}
      buildRows={({ start, end, filters }) => {
        const rows = rowsOrders(start, end, "Paid");
        if (filters.channel && filters.channel !== "All") {
          return rows.filter((r) => r.channel === filters.channel);
        }
        return rows;
      }}
    />
  );
}
