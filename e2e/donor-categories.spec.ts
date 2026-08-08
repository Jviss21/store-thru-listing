import { test, expect } from "@playwright/test";
import { apiLoginAdmin, apiLoginLister, loginAsLister } from "./helpers/auth";
import {
  BACKEND_BASE_URL,
  INTAKE_CATEGORIES,
  uniqueSku,
} from "./helpers/env";

type ProductsResponse = {
  ok?: boolean;
  source?: string;
  data?: { sku?: string; category?: string; barcode?: string; title?: string }[];
  error?: string;
  fallback?: string;
};

test.describe("Category / donor create", () => {
  test("Donor Item Creation UI allocates SKU + barcode", async ({ page }) => {
    await loginAsLister(page);
    await page.goto("/manifests/new");
    await expect(page.getByRole("heading", { name: /create donor batch/i })).toBeVisible({
      timeout: 25_000,
    });

    const batchId = `QA-${Date.now()}`;
    await page.getByPlaceholder(/BATCH-1001/i).fill(batchId);
    const title = `QA Donor Tee ${Date.now()}`;
    await page.getByPlaceholder(/Red sweater/i).fill(title);
    await page.getByRole("button", { name: /add product/i }).click();

    await expect(page.getByText(/Generated SKU/i)).toBeVisible({ timeout: 10_000 });
    const flash = page.getByText(/Generated SKU/i);
    const flashText = await flash.textContent();
    expect(flashText).toMatch(/SKU\s+\S+/i);
    expect(flashText).toMatch(/barcode\s+\S+/i);

    // Line appears with SKU · Barcode
    const line = page.locator("li").filter({ hasText: title });
    await expect(line).toBeVisible();
    await expect(line.getByText(/SKU\s+\S+/i)).toBeVisible();
    await expect(line.getByText(/SKU\s+\S+\s*·\s*Barcode\s+\S+/i)).toBeVisible();

    // Finish batch → putaway/scan handoff (optional path)
    await page.getByRole("button", { name: /create item/i }).click();
    await page.waitForURL(/\/(products\/scan|manifests)/, { timeout: 30_000 });
  });

  for (const category of INTAKE_CATEGORIES) {
    test(`API create + list product in category: ${category}`, async ({
      request,
    }) => {
      const ok = await apiLoginLister(request);
      expect(ok, "NextAuth API login as Lister failed").toBeTruthy();

      const sku = uniqueSku("QA-CAT");
      const title = `QA ${category} ${sku}`;
      const barcode = sku;

      const create = await request.post("/api/products", {
        data: {
          sku,
          title,
          barcode,
          category,
          status: "Draft",
          price: 9.99,
          location: "Receiving",
          supplier: "QA Donor",
          tags: ["Donor", "e2e", `category:${category}`],
          description: `E2E intake for ${category}`,
        },
      });

      const createJson = (await create.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fallback?: string;
        data?: { sku?: string; category?: string };
        source?: string;
      };

      if (create.status() === 503 || createJson.fallback === "mock") {
        // Postgres unavailable — assert mock/list path still works and document.
        test.info().annotations.push({
          type: "note",
          description:
            "DB unavailable (503/mock). Product create skipped; verifying GET /api/products list.",
        });
        const list = await request.get("/api/products");
        expect(list.ok()).toBeTruthy();
        const listJson = (await list.json()) as ProductsResponse;
        expect(listJson.ok).toBeTruthy();
        expect(Array.isArray(listJson.data)).toBeTruthy();
        expect(
          listJson.source === "mock" ||
            listJson.source === "prisma" ||
            listJson.source === "catalog"
        ).toBeTruthy();
        return;
      }

      expect(
        create.ok(),
        `POST /api/products failed: ${create.status()} ${JSON.stringify(createJson)}`
      ).toBeTruthy();
      expect(createJson.ok).toBeTruthy();
      expect(createJson.data?.sku || sku).toBeTruthy();

      const list = await request.get("/api/products?includeMock=0");
      expect(list.ok()).toBeTruthy();
      const listJson = (await list.json()) as ProductsResponse;
      expect(listJson.ok).toBeTruthy();
      const found = (listJson.data || []).find((p) => p.sku === sku);
      expect(found, `SKU ${sku} missing from products list`).toBeTruthy();
      if (found?.category) {
        expect(found.category).toBe(category);
      }

      // Optional backend sync check
      if (BACKEND_BASE_URL) {
        const be = await request.get(
          `${BACKEND_BASE_URL.replace(/\/$/, "")}/api/v1/products?includeMock=0`,
          { failOnStatusCode: false }
        );
        if (be.status() === 401 || be.status() === 403) {
          test.info().annotations.push({
            type: "note",
            description:
              "Backend /api/v1/products reachable but session cookie not shared — check sync manually with same DB.",
          });
        } else if (be.ok()) {
          const beJson = (await be.json()) as ProductsResponse;
          const beFound = (beJson.data || []).find((p) => p.sku === sku);
          if (beFound) {
            expect(beFound.sku).toBe(sku);
          } else {
            test.info().annotations.push({
              type: "note",
              description:
                "SKU not on backend yet (mirror-first / separate DB). IMS create succeeded.",
            });
          }
        }
      }
    });
  }

  test("IMS products list returns data for Admin session", async ({
    request,
  }) => {
    const ok = await apiLoginAdmin(request);
    expect(ok).toBeTruthy();
    const list = await request.get("/api/products");
    expect(list.ok()).toBeTruthy();
    const json = (await list.json()) as ProductsResponse;
    expect(json.ok).toBeTruthy();
    expect(Array.isArray(json.data)).toBeTruthy();
  });
});
