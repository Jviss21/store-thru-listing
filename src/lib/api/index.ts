export type {
  ApiClient,
  ApiResult,
  SyncError,
  OrgHealth,
  MarketplaceConnectionState,
} from "./types";
export { createMockApiClient } from "./mock-client";
export { createLiveApiClient } from "./live-client";
export { getMarketplaceMode, isLiveMarketplaceMode } from "./config";
export type { MarketplaceMode } from "./config";
export {
  createEbayClient,
  createShopGoodwillClient,
  getMarketplaceClient,
  listMarketplaceStatuses,
} from "./marketplaces";

export {
  getEbayAspectsClient,
  setEbayAspectsClient,
  MockEbayAspectsClient,
  reconcileItemSpecifics,
  defaultEbayCategoryIdForProductCategory,
} from "./ebay-aspects";
export type {
  EbayAspectsClient,
  EbayAspect,
  EbayCategoryAspects,
  EbayCategoryOption,
} from "./ebay-aspects";

import { getMarketplaceMode } from "./config";
import { createLiveApiClient } from "./live-client";
import { createMockApiClient } from "./mock-client";
import type { ApiClient } from "./types";

/**
 * Factory — mock by default; set NEXT_PUBLIC_MARKETPLACE_MODE=live
 * (or MARKETPLACE_MODE=live) to route connections through marketplace stubs.
 */
export function createApiClient(): ApiClient {
  return getMarketplaceMode() === "live" ? createLiveApiClient() : createMockApiClient();
}

/** Singleton for client components. */
let client: ApiClient | null = null;
export function getApiClient(): ApiClient {
  if (!client) client = createApiClient();
  return client;
}

