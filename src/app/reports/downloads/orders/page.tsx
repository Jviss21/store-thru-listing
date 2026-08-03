"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsOrders } from "@/lib/report-download-rows";

export default function OrdersDownloadPage() {
  return (
    <DownloadReportPage
      reportType="orders"
      title="Orders Report"
      about="This report includes all orders created within a given date range."
      filenamePrefix="orders"
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
        const rows = rowsOrders(start, end);
        if (filters.channel && filters.channel !== "All") {
          return rows.filter((r) => r.channel === filters.channel);
        }
        return rows;
      }}
    />
  );
}
