import type {
  Listing,
  ListingChannel,
  Order,
  Product,
  Shipment,
} from "@/lib/types";
import type { Org, OrgFeatureFlags, OrgSyncStatus } from "@/lib/orgs";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export type AutoListQueueItem = {
  id: string;
  productId: string;
  title: string;
  sku: string;
  channel: ListingChannel;
  price: number;
  readiness: number;
  generatedAt: string;
  orgId: string;
};

export type MarketplaceConnectionState = {
  id: string;
  channel: "ShopGoodwill" | "eBay";
  accountId: string;
  accountName: string;
  status: "Connected" | "Not connected" | "Needs attention";
  syncEnabled: boolean;
  lastSyncAt: string | null;
  notes: string;
};

export type SyncError = {
  id: string;
  orgId: string;
  channel: ListingChannel | "System";
  listingId?: string;
  sku: string;
  title: string;
  message: string;
  at: string;
  severity: "error" | "warning";
};

export type PhotoAsset = {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
};

export type ReportSummary = {
  id: string;
  name: string;
  href: string;
  description: string;
};

export type OrgHealth = {
  orgId: string;
  syncStatus: OrgSyncStatus;
  errorCount: number;
  autoListVolumeToday: number;
  lastForceSyncAt: string | null;
  flags: OrgFeatureFlags;
  recentErrors: SyncError[];
};

export type ProductsApi = {
  list(orgId: string): Promise<ApiResult<Product[]>>;
  get(orgId: string, id: string): Promise<ApiResult<Product | null>>;
};

export type ListingsApi = {
  list(orgId: string, channel?: ListingChannel): Promise<ApiResult<Listing[]>>;
  get(orgId: string, id: string): Promise<ApiResult<Listing | null>>;
  update(
    orgId: string,
    id: string,
    patch: Partial<Listing>
  ): Promise<ApiResult<Listing>>;
};

export type AutoListApi = {
  queue(orgId: string): Promise<ApiResult<AutoListQueueItem[]>>;
};

export type OrdersApi = {
  list(orgId: string): Promise<ApiResult<Order[]>>;
};

export type ShipmentsApi = {
  list(orgId: string): Promise<ApiResult<Shipment[]>>;
};

export type ReportsApi = {
  summaries(orgId: string): Promise<ApiResult<ReportSummary[]>>;
};

export type PhotosApi = {
  forProduct(orgId: string, productId: string): Promise<ApiResult<PhotoAsset[]>>;
};

export type ConnectionsApi = {
  list(orgId: string): Promise<ApiResult<MarketplaceConnectionState[]>>;
  connect(orgId: string, channel: "ShopGoodwill" | "eBay"): Promise<ApiResult<MarketplaceConnectionState>>;
  disconnect(orgId: string, channel: "ShopGoodwill" | "eBay"): Promise<ApiResult<MarketplaceConnectionState>>;
  syncNow(orgId: string, channel: "ShopGoodwill" | "eBay"): Promise<ApiResult<MarketplaceConnectionState>>;
};

export type OpsApi = {
  listOrgHealth(): Promise<ApiResult<OrgHealth[]>>;
  getOrgHealth(orgId: string): Promise<ApiResult<OrgHealth | null>>;
  setFlags(orgId: string, flags: Partial<OrgFeatureFlags>): Promise<ApiResult<OrgHealth>>;
  forceSync(orgId: string): Promise<ApiResult<OrgHealth>>;
  recentErrors(orgId: string): Promise<ApiResult<SyncError[]>>;
};

export type OrgsApi = {
  list(): Promise<ApiResult<Org[]>>;
  get(orgId: string): Promise<ApiResult<Org | null>>;
};

export type ApiClient = {
  products: ProductsApi;
  listings: ListingsApi;
  autoList: AutoListApi;
  orders: OrdersApi;
  shipments: ShipmentsApi;
  reports: ReportsApi;
  photos: PhotosApi;
  connections: ConnectionsApi;
  ops: OpsApi;
  orgs: OrgsApi;
};
