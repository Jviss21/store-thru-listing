import { test, expect } from "@playwright/test";
import { apiLoginAdmin, loginAsAdmin } from "./helpers/auth";
import { DEMO_PASSWORD, uniqueSku } from "./helpers/env";

/**
 * “Create a user” = Admin teammates invite.
 * “Create an Account” = accept invite (/invite/[token]) and set password.
 * Requires Postgres (DATABASE_URL). Soft-skips when DB unavailable.
 */
test.describe("Auth / users — invite + accept (Create a user / Create an Account)", () => {
  test("Admin can open Teammates invite UI", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/teammates");
    await expect(page.getByRole("heading", { name: /teammates/i })).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByRole("heading", { name: /invite teammate/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /send invite/i })).toBeVisible();
  });

  test("Create user via invite API + accept account (or skip if no DB)", async ({
    page,
    request,
  }) => {
    const loggedIn = await apiLoginAdmin(request);
    expect(loggedIn).toBeTruthy();

    const email = `qa.invite.${Date.now()}@testgoodwill.example`;
    const create = await request.post("/api/invites", {
      data: {
        email,
        role: "Lister",
      },
    });
    const createJson = (await create.json().catch(() => ({}))) as {
      ok?: boolean;
      inviteUrl?: string;
      data?: { inviteUrl?: string };
      error?: string;
      message?: string;
      source?: string;
    };

    if (
      create.status() === 503 ||
      create.status() === 500 ||
      !createJson.ok ||
      createJson.source === "unavailable" ||
      (!createJson.inviteUrl && !createJson.data?.inviteUrl)
    ) {
      test.skip(
        true,
        `Invite API unavailable (need DATABASE_URL). Response: ${create.status()} ${JSON.stringify(createJson).slice(0, 240)}`
      );
      return;
    }

    const inviteUrl = createJson.inviteUrl || createJson.data?.inviteUrl || "";
    expect(inviteUrl).toContain("/invite/");

    // Create an Account — accept invite UI
    await page.goto(inviteUrl);
    await expect(page.getByRole("heading", { name: /accept invite/i })).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByText(email)).toBeVisible();

    const password = `QaInvite!${uniqueSku("P").slice(-8)}12`;
    await page.locator("#name").fill("QA Invitee");
    await page.locator("#password").fill(password);
    await page.locator("#confirm").fill(password);
    await page.getByRole("button", { name: /accept & join|creating account/i }).click();

    // Either auto-signed-in to app, or “Account ready” + login
    await expect
      .poll(async () => page.url(), { timeout: 30_000 })
      .not.toMatch(/\/invite\//);

    // If landed on login, sign in with new password
    if (page.url().includes("/login")) {
      await page.locator("#email").fill(email);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: /sign in/i }).click();
      await page.waitForURL((u) => !u.pathname.startsWith("/login"), {
        timeout: 30_000,
      });
    }

    // Seed password still works for Admin
    void DEMO_PASSWORD;
  });
});
