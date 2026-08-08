import { test, expect } from "@playwright/test";
import {
  apiLoginAdmin,
  apiLoginLister,
  loginAsAdmin,
  loginAsLister,
} from "./helpers/auth";
import { ADMIN_EMAIL, LISTER_EMAIL } from "./helpers/env";

test.describe("Auth / users — login", () => {
  test("1a. API login as Lister", async ({ request }) => {
    const ok = await apiLoginLister(request);
    expect(ok, "NextAuth session for Lister").toBeTruthy();
    const session = await request.get("/api/auth/session");
    const body = (await session.json()) as { user?: { email?: string } };
    expect(body.user?.email?.toLowerCase()).toBe(LISTER_EMAIL.toLowerCase());
  });

  test("1. Login as Lister (john.doe@testgoodwill.example)", async ({
    page,
  }) => {
    await loginAsLister(page);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toContainText(/Hammoq|Products|Donor|Store/i);
    await page.goto("/products");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/products/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("2a. API login as Admin", async ({ request }) => {
    const ok = await apiLoginAdmin(request);
    expect(ok, "NextAuth session for Admin").toBeTruthy();
    const session = await request.get("/api/auth/session");
    const body = (await session.json()) as { user?: { email?: string } };
    expect(body.user?.email?.toLowerCase()).toBe(ADMIN_EMAIL.toLowerCase());
  });

  test("2. Login as Admin (morgan.hale@testgoodwill.example)", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/teammates|admin|configuration/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("wrong password stays on login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(LISTER_EMAIL);
    await page.locator("#password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test("seed emails are documented on login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toContainText(/john\.doe@/i);
    await expect(page.locator("body")).toContainText(/morgan\.hale/i);
    await expect(page.locator("body")).toContainText(/Lister/i);
    await expect(page.locator("body")).toContainText(/Admin/i);
  });
});
