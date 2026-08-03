/**
 * Phase 1 scaffold — multi-tenant data model (not wired to a live DB yet).
 * Prefer Prisma later (`prisma/schema.prisma`); this TypeScript sketch documents
 * the intended tables with orgId on every tenant-scoped row.
 *
 * Phase 0 deploys without Postgres. When auth/DB lands, map these shapes 1:1.
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
  /** Global Hammoq staff flag */
  isHammoqStaff: boolean;
  createdAt: string;
};

/** Membership of a user in an org (roles are org-scoped). */
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
  /** false = kill switch engaged */
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

/**
 * Suggested Prisma models (copy into prisma/schema.prisma when ready):
 *
 * model Org { id String @id ... products Product[] ... }
 * model Product { id String @id; orgId String; org Org @relation(...); @@index([orgId]) }
 * — every tenant table: orgId + @@index([orgId])
 */
export const SCHEMA_NOTES = {
  phase: 1,
  multiTenant: true,
  orgIdOnEveryTenantTable: true,
  auth: "Replace demo password with real auth; keep org memberships.",
  infinityAi: "Auto-List only — no Auto-Draft jobs table.",
} as const;
