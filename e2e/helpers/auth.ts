import type { APIRequestContext, Page } from "@playwright/test";
import { ADMIN_EMAIL, DEMO_PASSWORD, LISTER_EMAIL } from "./env";

/** UI login via /login form. */
export async function loginAs(
  page: Page,
  email: string,
  password = DEMO_PASSWORD
) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30_000,
  });
}

export async function loginAsLister(page: Page) {
  await loginAs(page, LISTER_EMAIL);
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, ADMIN_EMAIL);
}

/**
 * NextAuth credentials sign-in for APIRequestContext (cookie jar).
 * Returns true when session cookie is established.
 */
export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password = DEMO_PASSWORD
): Promise<boolean> {
  const csrfRes = await request.get("/api/auth/csrf");
  if (!csrfRes.ok()) return false;
  const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrfToken) return false;

  const signIn = await request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email,
      password,
      json: "true",
      redirect: "false",
      callbackUrl: "/",
    },
    maxRedirects: 0,
  });

  // NextAuth may 200 or 302 with Set-Cookie
  if (signIn.status() >= 400 && signIn.status() !== 302) {
    return false;
  }

  const session = await request.get("/api/auth/session");
  if (!session.ok()) return false;
  const body = (await session.json()) as { user?: { email?: string } };
  return Boolean(body.user?.email);
}

export async function apiLoginLister(request: APIRequestContext) {
  return apiLogin(request, LISTER_EMAIL);
}

export async function apiLoginAdmin(request: APIRequestContext) {
  return apiLogin(request, ADMIN_EMAIL);
}
