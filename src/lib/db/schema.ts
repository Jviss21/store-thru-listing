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
  barcode: string | null;
  title: string;
  status: "Active" | "Draft" | "Recycled";
  priceCents: number;
  location: string | null;
  supplier: string | null;
  category: string | null;
  description: string | null;
  photosJson: string | null;
  tagsJson: string | null;
  createdById: string | null;
  manifestId: string | null;
  createdAt: string;
};

export type DbManifest = {
  id: string;
  orgId: string;
  batchBarcode: string;
  supplier: string | null;
  notes: string | null;
  status: string;
  createdById: string | null;
  createdAt: string;
};

export type DbInvite = {
  id: string;
  orgId: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  invitedById: string | null;
  acceptedAt: string | null;
  createdAt: string;
};

export type DbOrgSettings = {
  orgId: string;
  adminImsJson: string;
  updatedAt: string;
  updatedById: string | null;
};

export type DbListing = {
  id: string;
  orgId: string;
  productId: string;
  channel: "ShopGoodwill" | "eBay";
  status: string;
  externalId: string | null;
  externalIdsJson: string | null;
  priceCents: number;
  lastSyncError: string | null;
};

export type DbOrderLine = {
  id: string;
  orderId: string;
  productId: string | null;
  sku: string | null;
  title: string | null;
  quantity: number;
  priceCents: number;
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
  phase: "1+ domain SoR",
  multiTenant: true,
  orgIdOnEveryTenantTable: true,
  prisma: "prisma/schema.prisma",
  auth: "NextAuth credentials; session carries userId, orgId, role, isOps",
  domain:
    "Product, Manifest/ManifestLine, Listing, Order/OrderLine, OrgSettings, Invite — prefer DB when ready",
  invites: "Admin creates Invite; /invite/[token] accept sets password + Membership",
  infinityAi: "Auto-List only — no Auto-Draft jobs table.",
  vercel:
    "Use Postgres DATABASE_URL (Neon) for Prisma; otherwise seed-module auth fallback. file: SQLite is skipped on Vercel.",
} as const;
