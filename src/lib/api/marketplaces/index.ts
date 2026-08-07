import { createEbayClient } from "./ebay";
import { createShopGoodwillClient } from "./shopgoodwill";
import type { MarketplaceChannel, MarketplaceClient, MarketplaceClientStatus } from "./types";

export type {
  MarketplaceChannel,
  MarketplaceClient,
  MarketplaceClientStatus,
  MarketplaceListingInput,
  MarketplaceListingResult,
  MarketplaceOAuthStart,
} from "./types";

export { createShopGoodwillClient } from "./shopgoodwill";
export { createEbayClient, markFakeEbaySold } from "./ebay";
export {
  getHammoqMarketConfig,
  fakeEbayMissingEnv,
  publishToHammoqMarket,
  delistOnHammoqMarket,
  soldOnHammoqMarket,
  getHammoqMarketListing,
} from "./hammoq-market";
export {
  realEbayConfigured,
  missingRealEbayEnv,
  buildEbayAuthorizeUrl,
  exchangeEbayAuthCode,
  refreshEbayAccessToken,
  getEbayUserAccessToken,
  storeEbayRefreshToken,
  loadEbayRefreshToken,
  clearEbayConnectionsByAccountId,
  EBAY_OAUTH_SCOPES,
} from "./ebay-oauth";
export {
  publishEbayInventoryListing,
  updateEbayInventoryListing,
  endEbayInventoryListing,
  formatEbayExternalId,
  parseEbayExternalId,
} from "./ebay-inventory";

export function getMarketplaceClient(channel: MarketplaceChannel): MarketplaceClient {
  return channel === "ShopGoodwill" ? createShopGoodwillClient() : createEbayClient();
}

export function listMarketplaceStatuses(): MarketplaceClientStatus[] {
  return [createShopGoodwillClient().status(), createEbayClient().status()];
}
