"use client";

import { DownloadReportPage } from "@/components/reports/DownloadReportPage";
import { rowsPaidOrderItems } from "@/lib/report-download-rows";

export default function PaidOrderItemsDownloadPage() {
  return (
    <DownloadReportPage
      reportType="paid-order-items"
      title="Paid Order Items Report"
      about="This report includes all line items paid within a given date range. Optionally filter by channel or payment status."
      filenamePrefix="paid-order-items"
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
        {
          id: "paymentStatus",
          label: "Payment status",
          defaultValue: "Paid",
          options: [
            { value: "Paid", label: "Paid" },
            { value: "All", label: "All" },
            { value: "Pending", label: "Pending" },
            { value: "Refunded", label: "Refunded" },
          ],
        },
      ]}
      buildRows={({ start, end, filters }) =>
        rowsPaidOrderItems(start, end, {
          channel: filters.channel,
          paymentStatus: filters.paymentStatus,
        })
      }
    />
  );
}
