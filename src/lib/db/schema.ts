/**
 * Phase 1 TypeScript sketch — kept in sync with prisma/schema.prisma.
 * Prefer Prisma models for persistence; these types document the tenant shape.
 */

export type DbOrg = {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  type: "goodwill" | "resale" | "other";
  createdAt: string;
  updatedAt: string;
};

export type DbUser = {
  id: string;
  email: string;
  name: string;
  /** Global Hammoq staff flag (session.isOps) */
  isOps: boolean;
  createdAt: string;
};

export type DbOrgMembership = {
  id: string;
  orgId: string;
  userId: string;
  role: "Admin" | "Ops Lead" | "Lister" | "Photographer" | "Viewer";
  status: "Active" | "Invited" | "Deactivated";
};

export type DbFeatureFlags = {
  orgId: string;
  autoList: boolean;
  shopgoodwill: boolean;
  ebay: boolean;
  killSwitchOff: boolean;
  updatedAt: string;
};

export type DbMarketplaceConnection = {
  id: string;
  orgId: string;
  channel: "ShopGoodwill" | "eBay";
  accountId: string | null;
  status: "Connected" | "Not connected" | "Needs attention";
  oauthRefreshTokenEnc: string | null;
  lastSyncAt: string | null;
  syncEnabled: boolean;
};

export type DbProduct = {
  id: string;
  orgId: string;
  sku: string;
  title: string;
  status: "Active" | "Draft" | "Recycled";
  priceCents: number;
  createdAt: string;
};

export type DbListing = {
  id: string;
  orgId: string;
  productId: string;
  channel: "ShopGoodwill" | "eBay";
  status: string;
  externalId: string | null;
  priceCents: number;
  lastSyncError: string | null;
};

export type DbAutoListJob = {
  id: string;
  orgId: string;
  productId: string;
  channel: "ShopGoodwill" | "eBay";
  readiness: number;
  status: "Queued" | "Published" | "Failed" | "HeldQA";
  createdAt: string;
};

export type DbOrder = {
  id: string;
  orgId: string;
  orderNumber: string;
  channel: "ShopGoodwill" | "eBay";
  totalCents: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
};

export type DbShipment = {
  id: string;
  orgId: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  shippedAt: string | null;
};

export type DbPhoto = {
  id: string;
  orgId: string;
  productId: string;
  storageKey: string;
  sortOrder: number;
};

export type DbSyncError = {
  id: string;
  orgId: string;
  channel: string;
  listingId: string | null;
  sku: string | null;
  message: string;
  severity: "error" | "warning";
  createdAt: string;
};

export type DbAuditEvent = {
  id: string;
  orgId: string | null;
  userId: string | null;
  action: string;
  metaJson: string | null;
  createdAt: string;
};

export const SCHEMA_NOTES = {
  phase: 1,
  multiTenant: true,
  orgIdOnEveryTenantTable: true,
  prisma: "prisma/schema.prisma",
  auth: "NextAuth credentials; session carries userId, orgId, role, isOps",
  infinityAi: "Auto-List only — no Auto-Draft jobs table.",
  vercel:
    "SQLite file: URLs are skipped on Vercel; use Postgres DATABASE_URL or seed-module auth fallback.",
} as const;
