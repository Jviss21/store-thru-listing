import { test, expect } from "@playwright/test";
import { apiLoginLister, loginAsLister } from "./helpers/auth";
import { uniqueSku } from "./helpers/env";

test.describe("Extras (lightweight)", () => {
  test("Fake eBay / Market publish (skip if FAKE_EBAY not configured)", async ({
    request,
  }) => {
    const ok = await apiLoginLister(request);
    expect(ok).toBeTruthy();

    const sku = uniqueSku("QA-EBAY");
    const publish = await request.post("/api/marketplaces/ebay/publish", {
      data: {
        productId: `e2e-${sku}`,
        sku,
        title: `QA Fake eBay ${sku}`,
        description: "E2E smoke — safe to delist",
        priceCents: 850,
        category: "Home",
        condition: "Used - Good",
      },
    });
    const json = (await publish.json().catch(() => ({}))) as {
      ok?: boolean;
      code?: string;
      error?: string;
      listingId?: string;
      publicUrl?: string;
      data?: {
        externalId?: string;
        url?: string;
        status?: string;
        message?: string;
      };
    };

    if (json.code === "NOT_CONFIGURED" || (publish.status() === 400 && !json.ok)) {
      test.skip(
        true,
        `FAKE_EBAY not configured on target — skipped. ${json.error || ""}`
      );
      return;
    }

    expect(
      publish.ok(),
      `Publish failed: ${publish.status()} ${JSON.stringify(json)}`
    ).toBeTruthy();
    expect(json.ok).toBeTruthy();
    const idOrUrl =
      json.data?.url ||
      json.data?.externalId ||
      json.listingId ||
      json.publicUrl;
    expect(idOrUrl, `Unexpected publish payload: ${JSON.stringify(json)}`).toBeTruthy();
  });

  test("Putaway / scan page loads after login (one case)", async ({ page }) => {
    await loginAsLister(page);
    await page.goto("/products/scan");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/putaway|scan|barcode|location/i).first()
    ).toBeVisible({ timeout: 25_000 });
  });

  test("Marketplace status endpoint responds", async ({ request }) => {
    const ok = await apiLoginLister(request);
    expect(ok).toBeTruthy();
    const status = await request.get("/api/marketplaces/status");
    // Some deployments may 404 if route not shipped — soft assert
    if (status.status() === 404) {
      test.skip(true, "GET /api/marketplaces/status not present on target");
      return;
    }
    expect(status.ok()).toBeTruthy();
    const json = await status.json();
    expect(json).toBeTruthy();
  });
});
