/**
 * Marketplace adapter mode — mock (pilot UI) vs live (real client stubs).
 * Client components read NEXT_PUBLIC_MARKETPLACE_MODE; server may also use MARKETPLACE_MODE.
 */

export type MarketplaceMode = "mock" | "live";

export function getMarketplaceMode(): MarketplaceMode {
  const raw =
    process.env.NEXT_PUBLIC_MARKETPLACE_MODE?.trim() ||
    process.env.MARKETPLACE_MODE?.trim() ||
    "mock";
  return raw.toLowerCase() === "live" ? "live" : "mock";
}

export function isLiveMarketplaceMode(): boolean {
  return getMarketplaceMode() === "live";
}
