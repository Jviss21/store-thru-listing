import type { ApiResult } from "@/lib/api/types";

export type MarketplaceChannel = "ShopGoodwill" | "eBay";

export type MarketplaceListingInput = {
  orgId: string;
  sku: string;
  title: string;
  description?: string;
  priceCents: number;
  quantity?: number;
  imageUrls?: string[];
  externalId?: string;
};

export type MarketplaceListingResult = {
  channel: MarketplaceChannel;
  externalId: string;
  status: "Published" | "Queued" | "Failed" | "Ended";
  url?: string;
  message?: string;
};

export type MarketplaceOAuthStart = {
  channel: MarketplaceChannel;
  authorizeUrl: string;
  state: string;
};

export type MarketplaceClientStatus = {
  channel: MarketplaceChannel;
  configured: boolean;
  missingEnv: string[];
  mode: "stub" | "live";
};

/** Channel-specific marketplace operations (Phase 2). */
export type MarketplaceClient = {
  channel: MarketplaceChannel;
  status(): MarketplaceClientStatus;
  /** Begin OAuth; returns authorize URL when configured, else NOT_CONFIGURED. */
  startOAuth(orgId: string, redirectUri: string): Promise<ApiResult<MarketplaceOAuthStart>>;
  createListing(input: MarketplaceListingInput): Promise<ApiResult<MarketplaceListingResult>>;
  updateListing(
    orgId: string,
    externalId: string,
    patch: Partial<MarketplaceListingInput>
  ): Promise<ApiResult<MarketplaceListingResult>>;
  endListing(orgId: string, externalId: string): Promise<ApiResult<MarketplaceListingResult>>;
  syncListings(orgId: string): Promise<ApiResult<{ syncedAt: string; count: number }>>;
};
