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
  LiveEbayAspectsClient,
  reconcileItemSpecifics,
  defaultEbayCategoryIdForProductCategory,
  getSgwFieldsForPath,
  SGW_CATEGORY_PATHS,
  seedSpecificsFromTitle,
  missingRequiredSpecifics,
  inferBrandFromTitle,
} from "./ebay-aspects";
export type {
  EbayAspectsClient,
  EbayAspect,
  EbayCategoryAspects,
  EbayCategoryOption,
  SgwCategoryField,
  SgwCategoryFields,
} from "./ebay-aspects";

export {
  getEbayTaxonomyClient,
  setEbayTaxonomyClient,
  MockEbayTaxonomyClient,
  LiveEbayTaxonomyClient,
  isEbayTaxonomyConfigured,
} from "@/lib/ebay/taxonomy-client";
export {
  getBundledCategoryIndex,
  searchCategories,
  getCategoryPath,
} from "@/lib/ebay/category-tree";

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

