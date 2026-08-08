import { afterEach, describe, expect, it } from "vitest";
import {
  fakeEbayMissingEnv,
  getHammoqMarketConfig,
} from "@/lib/api/marketplaces/hammoq-market";

describe("Fake eBay (Hammoq Market) config", () => {
  const keys = [
    "FAKE_EBAY_API_URL",
    "FAKE_EBAY_API_KEY",
    "MARKETPLACE_CHANNEL_URL",
    "MARKETPLACE_CHANNEL_API_KEY",
  ] as const;
  const snapshot: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of keys) {
      if (snapshot[k] === undefined) delete process.env[k];
      else process.env[k] = snapshot[k];
    }
  });

  function clearMarketEnv() {
    for (const k of keys) {
      snapshot[k] = process.env[k];
      delete process.env[k];
    }
  }

  it("reports not configured without env", () => {
    clearMarketEnv();
    const cfg = getHammoqMarketConfig();
    expect(cfg.configured).toBe(false);
    expect(fakeEbayMissingEnv().length).toBeGreaterThan(0);
  });

  it("configured when URL + key set (no real eBay OAuth needed)", () => {
    clearMarketEnv();
    process.env.FAKE_EBAY_API_URL = "https://example-market.test";
    process.env.FAKE_EBAY_API_KEY = "hmq_demo_testgoodwill_west_devkey";
    const cfg = getHammoqMarketConfig();
    expect(cfg.configured).toBe(true);
    expect(cfg.storeSlug).toBeTruthy();
  });
});
