import { BRAND } from "@/lib/mock-data";

export type ReportNavItem = {
  href: string;
  label: string;
  description?: string;
  stub?: boolean;
};

export const IN_APP_REPORTS: ReportNavItem[] = [
  {
    href: "/reports/productivity",
    label: "User productivity",
    description: "Accepted through shipped metrics by teammate.",
  },
  {
    href: "/reports/operational",
    label: "Operational productivity",
    description: "Daily pipeline throughput with chart + table.",
  },
  {
    href: "/reports/poster-overview",
    label: "Poster overview",
    description: "Actual vs target postings, hours, and rates.",
  },
  {
    href: "/reports/poster-targets",
    label: "Poster targets",
    description: "Bar comparison of actuals vs targets.",
  },
  {
    href: "/reports/manifests",
    label: "Donor Item Creation",
    description: "Supplier acceptance, sell-thru, and user rollups.",
  },
  {
    href: "/reports/suppliers",
    label: "Suppliers",
    description: "Hub for sales overview, intake items, and activity.",
  },
  {
    href: "/reports/top-sales",
    label: "Top sales",
    description: "Top 50 item sales with channel and poster filters.",
  },
  {
    href: "/reports/events",
    label: "Master event log",
    description: "Timestamp, resource, event, and IP audit trail.",
  },
  {
    href: "/reports/sales-by-category",
    label: "Sales by category",
    description: "Hierarchical category sales, items, and avg PPI.",
  },
];

export const DOWNLOAD_REPORTS: ReportNavItem[] = [
  {
    href: "/reports/downloads/shopgoodwill",
    label: "ShopGoodwill listings",
    description: "Listings created on ShopGoodwill within a date range.",
  },
  {
    href: "/reports/downloads/ebay",
    label: "eBay listings",
    description: "Listings created on eBay within a date range.",
  },
  {
    href: "/reports/downloads/paid-orders",
    label: "Paid orders",
    description: "Orders marked paid within a date range.",
  },
  {
    href: "/reports/downloads/paid-order-items",
    label: "Paid order items",
    description: "Line items paid within a date range; filter by channel or payment status.",
  },
  {
    href: "/reports/downloads/orders",
    label: "Orders",
    description: "All orders created within a date range.",
  },
  {
    href: "/reports/downloads/refunds",
    label: "Refunds",
    description: "Refunded orders and amounts within a date range.",
  },
  {
    href: "/reports/downloads/manifest-items",
    label: "Donor intake items",
    description: "Donor Item Creation batch items created within a date range.",
  },
  {
    href: "/reports/downloads/shipments",
    label: "Shipments",
    description: "Shipments created within a date range.",
  },
  {
    href: "/reports/downloads/products",
    label: "Products",
    description: "Products created within a date range.",
  },
  {
    href: "/reports/downloads/auto-list",
    label: `${BRAND.autoList} queue`,
    description: `${BRAND.ai} ${BRAND.autoList} queue snapshot for the selected range.`,
  },
];

export const TIMEZONES = [
  "America/Denver",
  "America/Los_Angeles",
  "America/Chicago",
  "America/New_York",
  "UTC",
] as const;
