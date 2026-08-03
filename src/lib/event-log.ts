/**
 * Org-scoped IMS event log — section panels + Admin/Ops master trail.
 * Persists append-only rows in localStorage; merges with seeded mock history.
 */

import { DEFAULT_ORG_ID } from "@/lib/orgs";
import { loadSession } from "@/lib/session";

export type EventSection =
  | "products"
  | "listings"
  | "orders"
  | "shipments"
  | "manifests"
  | "auto-list"
  | "admin"
  | "reports";

export type EventLogEntry = {
  id: string;
  at: string;
  orgId: string;
  section: EventSection;
  action: string;
  resource: string;
  resourceHref?: string;
  user: string;
  userName?: string;
};

export const EVENT_LOG_CHANGED = "stl-event-log-changed";
export const EVENT_LOG_STORAGE_PREFIX = "stl-event-log:";

export const EVENT_SECTION_LABELS: Record<EventSection, string> = {
  products: "Products",
  listings: "Listings",
  orders: "Orders",
  shipments: "Shipments",
  manifests: "Item Creation",
  "auto-list": "Auto-List",
  admin: "Admin",
  reports: "Reports",
};

type LogEventInput = {
  section: EventSection;
  action: string;
  resource: string;
  resourceHref?: string;
  user?: string;
  userName?: string;
  orgId?: string;
  at?: string;
};

function storageKey(orgId: string) {
  return `${EVENT_LOG_STORAGE_PREFIX}${orgId}`;
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600000).toISOString();
}

function minsAgo(m: number) {
  return new Date(Date.now() - m * 60000).toISOString();
}

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86400000).toISOString();
}

/** Deterministic mock history so section logs are never empty on first load. */
export function buildSeedEvents(orgId: string): EventLogEntry[] {
  const rows: Array<Omit<EventLogEntry, "id" | "orgId">> = [
    // Products
    {
      at: minsAgo(4),
      section: "products",
      user: "jdoe",
      userName: "John Doe",
      action: "Saved product",
      resource: "Product SKU-1001",
      resourceHref: "/products/p1",
    },
    {
      at: minsAgo(28),
      section: "products",
      user: "bwilson",
      userName: "Bob Wilson",
      action: "Uploaded 6 photos",
      resource: "Product SKU-1012",
      resourceHref: "/products",
    },
    {
      at: hoursAgo(2),
      section: "products",
      user: "jsmith",
      userName: "Jane Smith",
      action: "Created draft product",
      resource: "Product SKU-1099",
      resourceHref: "/products/new",
    },
    {
      at: hoursAgo(5),
      section: "products",
      user: "infinity-ai",
      action: "Suggested title + category",
      resource: "Product SKU-1044",
      resourceHref: "/products",
    },
    {
      at: hoursAgo(9),
      section: "products",
      user: "slee",
      userName: "Sara Lee",
      action: "Marked product Active",
      resource: "Product SKU-1088",
      resourceHref: "/products",
    },
    {
      at: daysAgo(1),
      section: "products",
      user: "ajones",
      userName: "Alice Jones",
      action: "Recycled product",
      resource: "Product SKU-0901",
      resourceHref: "/products?status=Recycled",
    },
    // Listings
    {
      at: minsAgo(12),
      section: "listings",
      user: "ajones",
      userName: "Alice Jones",
      action: "Saved listing",
      resource: "Listing EB-20021",
      resourceHref: "/listings/ebay",
    },
    {
      at: hoursAgo(1),
      section: "listings",
      user: "jsmith",
      userName: "Jane Smith",
      action: "Queued to ShopGoodwill",
      resource: "Listing SGW-88401",
      resourceHref: "/listings/shopgoodwill",
    },
    {
      at: hoursAgo(3),
      section: "listings",
      user: "system",
      action: "Sync validation failed",
      resource: "Listing EB-19980",
      resourceHref: "/listings/ebay?status=Additional%20QA%20Required",
    },
    {
      at: hoursAgo(6),
      section: "listings",
      user: "mbrown",
      userName: "Mike Brown",
      action: "Delisted expired offer",
      resource: "Listing SGW-87112",
      resourceHref: "/listings/shopgoodwill",
    },
    {
      at: daysAgo(1),
      section: "listings",
      user: "jdoe",
      userName: "John Doe",
      action: "Updated BIN price",
      resource: "Listing EB-20005",
      resourceHref: "/listings/ebay",
    },
    // Orders
    {
      at: minsAgo(18),
      section: "orders",
      user: "jdoe",
      userName: "John Doe",
      action: "Opened order for fulfillment",
      resource: "Order ORD-2001",
      resourceHref: "/orders",
    },
    {
      at: hoursAgo(2),
      section: "orders",
      user: "system",
      action: "Marked paid (channel webhook)",
      resource: "Order ORD-2004",
      resourceHref: "/orders",
    },
    {
      at: hoursAgo(4),
      section: "orders",
      user: "mhale",
      userName: "Morgan Hale",
      action: "Exported paid orders CSV",
      resource: "Orders export",
      resourceHref: "/orders",
    },
    {
      at: hoursAgo(8),
      section: "orders",
      user: "jdoe",
      userName: "John Doe",
      action: "Partial fulfill",
      resource: "Order ORD-1998",
      resourceHref: "/orders?fulfillment=Partial",
    },
    {
      at: daysAgo(1),
      section: "orders",
      user: "system",
      action: "Refund recorded",
      resource: "Order ORD-1982",
      resourceHref: "/orders",
    },
    // Shipments
    {
      at: minsAgo(9),
      section: "shipments",
      user: "mbrown",
      userName: "Mike Brown",
      action: "Created USPS label",
      resource: "Shipment 390000000101",
      resourceHref: "/shipments",
    },
    {
      at: hoursAgo(1.5),
      section: "shipments",
      user: "jdoe",
      userName: "John Doe",
      action: "Downloaded label PDF",
      resource: "Shipment 390000000088",
      resourceHref: "/shipments",
    },
    {
      at: hoursAgo(5),
      section: "shipments",
      user: "ajones",
      userName: "Alice Jones",
      action: "Created FedEx label",
      resource: "Shipment 390000000055",
      resourceHref: "/shipments/new",
    },
    {
      at: hoursAgo(11),
      section: "shipments",
      user: "system",
      action: "Tracking in transit",
      resource: "Shipment 390000000033",
      resourceHref: "/shipments",
    },
    {
      at: daysAgo(2),
      section: "shipments",
      user: "jdoe",
      userName: "John Doe",
      action: "Exported shipments CSV",
      resource: "Shipments export",
      resourceHref: "/shipments",
    },
    // Item Creation (manifests)
    {
      at: minsAgo(22),
      section: "manifests",
      user: "jsmith",
      userName: "Jane Smith",
      action: "Marked item missing",
      resource: "Manifest MF-5701",
      resourceHref: "/manifests",
    },
    {
      at: hoursAgo(2),
      section: "manifests",
      user: "bwilson",
      userName: "Bob Wilson",
      action: "Received intake batch",
      resource: "Manifest MF-5690",
      resourceHref: "/manifests",
    },
    {
      at: hoursAgo(7),
      section: "manifests",
      user: "jdoe",
      userName: "John Doe",
      action: "Created item batch",
      resource: "Manifest MF-5712",
      resourceHref: "/manifests/new",
    },
    {
      at: hoursAgo(14),
      section: "manifests",
      user: "slee",
      userName: "Sara Lee",
      action: "Status → Partially Processed",
      resource: "Manifest MF-5682",
      resourceHref: "/manifests",
    },
    {
      at: daysAgo(1),
      section: "manifests",
      user: "ajones",
      userName: "Alice Jones",
      action: "Exported manifests CSV",
      resource: "Manifests export",
      resourceHref: "/manifests",
    },
    // Auto-List
    {
      at: minsAgo(6),
      section: "auto-list",
      user: "infinity-ai",
      action: "Queued SKU-1008 to ShopGoodwill",
      resource: "Auto-List batch",
      resourceHref: "/products/auto-list",
    },
    {
      at: hoursAgo(1),
      section: "auto-list",
      user: "jdoe",
      userName: "John Doe",
      action: "Published 12 items",
      resource: "Auto-List run",
      resourceHref: "/products/auto-list",
    },
    {
      at: hoursAgo(4),
      section: "auto-list",
      user: "infinity-ai",
      action: "Skipped 3 items below confidence",
      resource: "Auto-List filter",
      resourceHref: "/products/auto-list",
    },
    {
      at: hoursAgo(10),
      section: "auto-list",
      user: "jsmith",
      userName: "Jane Smith",
      action: "Exported Auto-List queue",
      resource: "Queue CSV",
      resourceHref: "/products/auto-list",
    },
    {
      at: daysAgo(1),
      section: "auto-list",
      user: "mhale",
      userName: "Morgan Hale",
      action: "Updated listing strategy defaults",
      resource: "Strategy · Standard Box",
      resourceHref: "/admin/listing-defaults",
    },
    // Admin
    {
      at: minsAgo(40),
      section: "admin",
      user: "mhale",
      userName: "Morgan Hale",
      action: "Invited user",
      resource: "User ctaylor",
      resourceHref: "/admin/users",
    },
    {
      at: hoursAgo(3),
      section: "admin",
      user: "jdoe",
      userName: "John Doe",
      action: "Rotated marketplace connection",
      resource: "eBay OAuth",
      resourceHref: "/admin/marketplaces",
    },
    {
      at: hoursAgo(8),
      section: "admin",
      user: "mhale",
      userName: "Morgan Hale",
      action: "Updated org timezone",
      resource: "Organization",
      resourceHref: "/admin/organization",
    },
    {
      at: daysAgo(1),
      section: "admin",
      user: "ops",
      userName: "Hammoq Ops",
      action: "Impersonated org session",
      resource: "Org switch",
      resourceHref: "/ops",
    },
    // Reports
    {
      at: hoursAgo(0.5),
      section: "reports",
      user: "jdoe",
      userName: "John Doe",
      action: "Generated productivity report",
      resource: "User productivity",
      resourceHref: "/reports/productivity",
    },
    {
      at: hoursAgo(3),
      section: "reports",
      user: "mhale",
      userName: "Morgan Hale",
      action: "Downloaded paid orders CSV",
      resource: "Paid orders",
      resourceHref: "/reports/downloads/paid-orders",
    },
    {
      at: hoursAgo(12),
      section: "reports",
      user: "ajones",
      userName: "Alice Jones",
      action: "Opened top sales",
      resource: "Top sales",
      resourceHref: "/reports/top-sales",
    },
    {
      at: daysAgo(2),
      section: "reports",
      user: "jdoe",
      userName: "John Doe",
      action: "Exported event logs CSV",
      resource: "Event logs",
      resourceHref: "/reports/events",
    },
  ];

  return rows.map((r, i) => ({
    ...r,
    id: `seed-${orgId}-${i}`,
    orgId,
  }));
}

function readPersisted(orgId: string): EventLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EventLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersisted(orgId: string, rows: EventLogEntry[]) {
  if (typeof window === "undefined") return;
  // Cap growth; keep newest
  const trimmed = rows.slice(0, 500);
  localStorage.setItem(storageKey(orgId), JSON.stringify(trimmed));
  window.dispatchEvent(
    new CustomEvent(EVENT_LOG_CHANGED, { detail: { orgId } })
  );
}

function sortNewest(a: EventLogEntry, b: EventLogEntry) {
  return new Date(b.at).getTime() - new Date(a.at).getTime();
}

function mergeEvents(orgId: string): EventLogEntry[] {
  const seed = buildSeedEvents(orgId);
  const persisted = readPersisted(orgId);
  const seen = new Set(persisted.map((e) => e.id));
  const merged = [...persisted, ...seed.filter((e) => !seen.has(e.id))];
  return merged.sort(sortNewest);
}

export function logEvent(input: LogEventInput): EventLogEntry {
  const session = typeof window !== "undefined" ? loadSession() : null;
  const orgId = input.orgId || session?.activeOrgId || DEFAULT_ORG_ID;
  const entry: EventLogEntry = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: input.at || new Date().toISOString(),
    orgId,
    section: input.section,
    action: input.action,
    resource: input.resource,
    resourceHref: input.resourceHref,
    user: input.user || session?.handle || "unknown",
    userName: input.userName || session?.name,
  };

  if (typeof window !== "undefined") {
    const existing = readPersisted(orgId);
    writePersisted(orgId, [entry, ...existing]);
  }

  return entry;
}

export function getSectionEvents(
  section: EventSection,
  orgId: string = DEFAULT_ORG_ID
): EventLogEntry[] {
  return mergeEvents(orgId).filter((e) => e.section === section);
}

export function getMasterEvents(orgId: string = DEFAULT_ORG_ID): EventLogEntry[] {
  return mergeEvents(orgId);
}

export function clearEventLog(orgId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(orgId));
  window.dispatchEvent(
    new CustomEvent(EVENT_LOG_CHANGED, { detail: { orgId } })
  );
}
