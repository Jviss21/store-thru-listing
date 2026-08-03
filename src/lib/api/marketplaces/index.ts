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
export { createEbayClient } from "./ebay";

export function getMarketplaceClient(channel: MarketplaceChannel): MarketplaceClient {
  return channel === "ShopGoodwill" ? createShopGoodwillClient() : createEbayClient();
}

export function listMarketplaceStatuses(): MarketplaceClientStatus[] {
  return [createShopGoodwillClient().status(), createEbayClient().status()];
}
