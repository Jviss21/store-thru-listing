import {
  BRAND,
  CURRENT_USER,
  ORG_NAME,
  ORG_SLUG,
  CARRIERS,
  dashboardStats,
  infinityStats,
  listings,
  eventLogRows,
} from "@/lib/mock-data";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();
const minsAgo = (m: number) => new Date(now - m * 60000).toISOString();

export type AdminRole = "Admin" | "Ops Lead" | "Lister" | "Photographer" | "Viewer";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: AdminRole;
  status: "Active" | "Invited" | "Deactivated";
  lastActiveAt: string;
  online: boolean;
};

export type PermissionKey =
  | "viewInventory"
  | "createListings"
  | "runAutoList"
  | "manageOrders"
  | "manageShipments"
  | "viewReports"
  | "manageUsers"
  | "manageOrg"
  | "manageConnections"
  | "manageAi";

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  viewInventory: "View inventory",
  createListings: "Create / edit listings",
  runAutoList: `Run ${BRAND.autoList}`,
  manageOrders: "Manage orders",
  manageShipments: "Manage shipments",
  viewReports: "View reports",
  manageUsers: "Manage users",
  manageOrg: "Manage organization",
  manageConnections: "Marketplace connections",
  manageAi: `${BRAND.ai} settings`,
};

export const ROLE_PERMISSIONS: Record<AdminRole, Record<PermissionKey, boolean>> = {
  Admin: {
    viewInventory: true,
    createListings: true,
    runAutoList: true,
    manageOrders: true,
    manageShipments: true,
    viewReports: true,
    manageUsers: true,
    manageOrg: true,
    manageConnections: true,
    manageAi: true,
  },
  "Ops Lead": {
    viewInventory: true,
    createListings: true,
    runAutoList: true,
    manageOrders: true,
    manageShipments: true,
    viewReports: true,
    manageUsers: true,
    manageOrg: false,
    manageConnections: true,
    manageAi: true,
  },
  Lister: {
    viewInventory: true,
    createListings: true,
    runAutoList: true,
    manageOrders: false,
    manageShipments: false,
    viewReports: true,
    manageUsers: false,
    manageOrg: false,
    manageConnections: false,
    manageAi: false,
  },
  Photographer: {
    viewInventory: true,
    createListings: false,
    runAutoList: false,
    manageOrders: false,
    manageShipments: false,
    viewReports: false,
    manageUsers: false,
    manageOrg: false,
    manageConnections: false,
    manageAi: false,
  },
  Viewer: {
    viewInventory: true,
    createListings: false,
    runAutoList: false,
    manageOrders: false,
    manageShipments: false,
    viewReports: true,
    manageUsers: false,
    manageOrg: false,
    manageConnections: false,
    manageAi: false,
  },
};

/** Ops Lead is admin-capable for this demo. */
export function isAdminCapable(role: AdminRole | string) {
  return role === "Admin" || role === "Ops Lead";
}

export const ADMIN_USERS: AdminUser[] = [
  {
    id: "u-jdoe",
    name: CURRENT_USER.name,
    email: CURRENT_USER.email,
    handle: CURRENT_USER.handle,
    role: "Ops Lead",
    status: "Active",
    lastActiveAt: minsAgo(1),
    online: true,
  },
  {
    id: "u-admin",
    name: "Morgan Hale",
    email: "morgan.hale@testgoodwill.example",
    handle: "mhale",
    role: "Admin",
    status: "Active",
    lastActiveAt: minsAgo(12),
    online: true,
  },
  {
    id: "u-jsmith",
    name: "Jane Smith",
    email: "jane.smith@testgoodwill.example",
    handle: "jsmith",
    role: "Lister",
    status: "Active",
    lastActiveAt: minsAgo(8),
    online: true,
  },
  {
    id: "u-ajones",
    name: "Alice Jones",
    email: "alice.jones@testgoodwill.example",
    handle: "ajones",
    role: "Lister",
    status: "Active",
    lastActiveAt: minsAgo(22),
    online: true,
  },
  {
    id: "u-bwilson",
    name: "Bob Wilson",
    email: "bob.wilson@testgoodwill.example",
    handle: "bwilson",
    role: "Photographer",
    status: "Active",
    lastActiveAt: hoursAgo(1),
    online: false,
  },
  {
    id: "u-mbrown",
    name: "Mike Brown",
    email: "mike.brown@testgoodwill.example",
    handle: "mbrown",
    role: "Lister",
    status: "Active",
    lastActiveAt: hoursAgo(2),
    online: false,
  },
  {
    id: "u-slee",
    name: "Sara Lee",
    email: "sara.lee@testgoodwill.example",
    handle: "slee",
    role: "Photographer",
    status: "Active",
    lastActiveAt: hoursAgo(3),
    online: true,
  },
  {
    id: "u-ctaylor",
    name: "Chris Taylor",
    email: "chris.taylor@testgoodwill.example",
    handle: "ctaylor",
    role: "Viewer",
    status: "Invited",
    lastActiveAt: daysAgo(2),
    online: false,
  },
  {
    id: "u-pmorgan",
    name: "Pat Morgan",
    email: "pat.morgan@testgoodwill.example",
    handle: "pmorgan",
    role: "Lister",
    status: "Deactivated",
    lastActiveAt: daysAgo(14),
    online: false,
  },
];

export const ORG_PROFILE = {
  name: ORG_NAME,
  slug: ORG_SLUG,
  timezone: "America/Los_Angeles",
  legalName: "Test Goodwill of the Pacific Demo Region",
  brandingNotes:
    "Navy #0D1B34 primary, gold #F0B429 accent, orange #E87A1A secondary. Floor UI matches store-thru-listing; Admin uses the same palette with an Admin badge.",
  poweredBy: BRAND.product,
  ai: BRAND.ai,
};

export const LOCATIONS = [
  {
    id: "loc-main",
    name: "Main Warehouse",
    code: "WH-MAIN",
    city: "Anonymized Demo City",
    state: "CA",
    type: "Warehouse" as const,
    active: true,
  },
  {
    id: "loc-annex",
    name: "Annex Processing",
    code: "WH-ANNEX",
    city: "Anonymized Demo City",
    state: "CA",
    type: "Warehouse" as const,
    active: true,
  },
  {
    id: "loc-store",
    name: "Retail Overflow",
    code: "ST-01",
    city: "Anonymized Demo City",
    state: "CA",
    type: "Store" as const,
    active: true,
  },
  {
    id: "loc-photo",
    name: "Photo Studio Bay",
    code: "PS-BAY",
    city: "Anonymized Demo City",
    state: "CA",
    type: "Station" as const,
    active: true,
  },
];

export type MarketplaceConnection = {
  id: string;
  channel: "ShopGoodwill" | "eBay";
  accountId: string;
  accountName: string;
  status: "Connected" | "Needs attention" | "Disconnected";
  syncEnabled: boolean;
  lastSyncAt: string;
  notes: string;
};

export const DEFAULT_CONNECTIONS: MarketplaceConnection[] = [
  {
    id: "conn-sgw",
    channel: "ShopGoodwill",
    accountId: "test_goodwill_sgw",
    accountName: "Test Goodwill — ShopGoodwill",
    status: "Connected",
    syncEnabled: true,
    lastSyncAt: minsAgo(18),
    notes: "Primary auction channel. Failed listings route to Additional QA Required.",
  },
  {
    id: "conn-ebay",
    channel: "eBay",
    accountId: "tgw-ebay-demo",
    accountName: "Test Goodwill eBay Store",
    status: "Connected",
    syncEnabled: true,
    lastSyncAt: minsAgo(42),
    notes: "Fixed-price + authenticated jewelry preferred. Policies managed in Listing defaults.",
  },
];

export type AiAdminSettings = {
  autoListEnabled: boolean;
  confidenceThreshold: number;
  requirePhotoMin: number;
  holdAuthenticated: boolean;
  authenticatedMinConfidence: number;
  categoryRouting: { category: string; preferredChannel: "ShopGoodwill" | "eBay" | "Both" }[];
  notes: string;
};

export const DEFAULT_AI_SETTINGS: AiAdminSettings = {
  autoListEnabled: true,
  confidenceThreshold: 88,
  requirePhotoMin: 3,
  holdAuthenticated: true,
  authenticatedMinConfidence: 95,
  categoryRouting: [
    { category: "Electronics", preferredChannel: "eBay" },
    { category: "Apparel", preferredChannel: "ShopGoodwill" },
    { category: "Jewelry & Accessories", preferredChannel: "eBay" },
    { category: "Collectibles", preferredChannel: "Both" },
    { category: "Books & Media", preferredChannel: "ShopGoodwill" },
    { category: "Home Goods", preferredChannel: "ShopGoodwill" },
  ],
  notes:
    "Authenticated designer and luxury pieces stay in Additional QA Required until an Ops Lead or Admin clears them. Auto-List never publishes below the confidence threshold.",
};

export type ListingDefaults = {
  defaultStrategy: string;
  defaultCarrier: string;
  shippingPolicy: string;
  returnsPolicy: string;
  paymentPolicy: string;
  itemLocation: string;
  ebayDuration: string;
  sgwDuration: string;
};

export const DEFAULT_LISTING_DEFAULTS: ListingDefaults = {
  defaultStrategy: "HardGoods $14.99",
  defaultCarrier: CARRIERS[0] ?? "FedEx",
  shippingPolicy: "Calculated shipping · Domestic ground",
  returnsPolicy: "30-day returns · Buyer pays return shipping",
  paymentPolicy: "Managed payments (marketplace default)",
  itemLocation: "Test Goodwill · Anonymized Demo Facility, USA",
  ebayDuration: "GTC (Good 'Til Cancelled)",
  sgwDuration: "7-day auction",
};

export type StationDevice = {
  id: string;
  name: string;
  kind: "Label printer" | "Photo station" | "Barcode scanner";
  location: string;
  status: "Online" | "Offline" | "Maintenance";
  lastSeenAt: string;
  detail: string;
};

export const DEFAULT_STATIONS: StationDevice[] = [
  {
    id: "st-print-1",
    name: "Label Printer — Station 1",
    kind: "Label printer",
    location: "Main Warehouse",
    status: "Online",
    lastSeenAt: minsAgo(3),
    detail: "4×6 shipping · Zebra-compatible",
  },
  {
    id: "st-print-2",
    name: "Label Printer — Station 2",
    kind: "Label printer",
    location: "Annex Processing",
    status: "Online",
    lastSeenAt: minsAgo(9),
    detail: "2×1 barcode + 4×6",
  },
  {
    id: "st-photo-a",
    name: "Photo Bay A",
    kind: "Photo station",
    location: "Photo Studio Bay",
    status: "Online",
    lastSeenAt: minsAgo(5),
    detail: "Lightbox + turntable · 8-angle preset",
  },
  {
    id: "st-photo-b",
    name: "Photo Bay B",
    kind: "Photo station",
    location: "Photo Studio Bay",
    status: "Maintenance",
    lastSeenAt: hoursAgo(6),
    detail: "Backdrop replacement scheduled",
  },
  {
    id: "st-scan-1",
    name: "Intake Scanner 1",
    kind: "Barcode scanner",
    location: "Main Warehouse",
    status: "Online",
    lastSeenAt: minsAgo(1),
    detail: "USB HID · Station dock",
  },
  {
    id: "st-scan-2",
    name: "Pack Bench Scanner",
    kind: "Barcode scanner",
    location: "Annex Processing",
    status: "Offline",
    lastSeenAt: daysAgo(1),
    detail: "Needs battery pack",
  },
];

export type AdminAuditEvent = {
  at: string;
  user: string;
  area: string;
  action: string;
};

export const ADMIN_AUDIT_EVENTS: AdminAuditEvent[] = [
  {
    at: minsAgo(4),
    user: "mhale",
    area: "Users",
    action: "Invited chris.taylor@testgoodwill.example as Viewer",
  },
  {
    at: minsAgo(25),
    user: "jdoe",
    area: BRAND.ai,
    action: `Raised ${BRAND.autoList} confidence threshold to 88%`,
  },
  {
    at: hoursAgo(1),
    user: "system",
    area: "Marketplaces",
    action: "ShopGoodwill sync completed — 204 pending, 28 Additional QA Required",
  },
  {
    at: hoursAgo(2),
    user: "mhale",
    area: "Organization",
    action: "Updated timezone to America/Los_Angeles",
  },
  {
    at: hoursAgo(3),
    user: "jdoe",
    area: "Stations",
    action: "Marked Photo Bay B as Maintenance",
  },
  {
    at: hoursAgo(5),
    user: "mhale",
    area: "Marketplaces",
    action: "Enabled eBay sync for tgw-ebay-demo",
  },
  {
    at: hoursAgo(8),
    user: "jdoe",
    area: "Listing defaults",
    action: "Set default strategy to HardGoods $14.99",
  },
  {
    at: daysAgo(1),
    user: "mhale",
    area: "Users",
    action: "Deactivated pmorgan (Lister)",
  },
  {
    at: daysAgo(1),
    user: "system",
    area: BRAND.autoList,
    action: `Published batch of ${infinityStats.autoListedToday} items across channels`,
  },
  {
    at: daysAgo(2),
    user: "jdoe",
    area: "Data",
    action: "Triggered full demo JSON export",
  },
];

export function getAdminOverviewMetrics() {
  const queued = listings.filter((l) => l.status === "Queued").length;
  const qaRequired = listings.filter((l) => l.status === "Additional QA Required").length;
  const onlineUsers = ADMIN_USERS.filter((u) => u.online && u.status === "Active").length;
  const activeUsers = ADMIN_USERS.filter((u) => u.status === "Active").length;

  return {
    onlineUsers,
    activeUsers,
    queuedListings: queued + dashboardStats.pendingShopgoodwill + dashboardStats.pendingEbay,
    queuedSeed: queued,
    pendingSgw: dashboardStats.pendingShopgoodwill,
    pendingEbay: dashboardStats.pendingEbay,
    additionalQaRequired: qaRequired + dashboardStats.failedListings,
    failedListings: dashboardStats.failedListings,
    autoListedToday: infinityStats.autoListedToday,
    salesYesterday: dashboardStats.salesYesterday,
    paidOrdersYesterday: dashboardStats.paidOrdersYesterday,
    unfulfilledOrders: dashboardStats.unfulfilledOrders,
  };
}

/** Admin audit + a filtered slice of floor event log (ops-relevant). */
export function getCombinedAdminAudit(): AdminAuditEvent[] {
  const fromFloor: AdminAuditEvent[] = eventLogRows
    .filter((r) => {
      const blob = `${r.entity} ${r.action}`.toLowerCase();
      // Prefer Auto-List / sync / QA / admin-ish floor events.
      if (blob.includes("auto-draft")) return false;
      return (
        blob.includes("auto-list") ||
        blob.includes("sync") ||
        blob.includes("failed") ||
        blob.includes("qa") ||
        r.user === "system" ||
        r.user === "jdoe" ||
        r.user === "mhale"
      );
    })
    .map((r) => ({
      at: r.at,
      user: r.user,
      area: r.entity,
      action: r.action,
    }));

  return [...ADMIN_AUDIT_EVENTS, ...fromFloor].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

/** localStorage keys the Data page may clear (demo session only). */
export const DEMO_LOCAL_STORAGE_KEYS = [
  "test-goodwill-settings",
  "test-goodwill-demo-created",
  "test-goodwill-demo-photos",
  "test-goodwill-demo-shipments",
  "test-goodwill-admin",
] as const;
