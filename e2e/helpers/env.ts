/** Shared env for e2e — no real eBay keys required. */

export const DEMO_PASSWORD =
  process.env.DEMO_PASSWORD?.trim() || "testgoodwill";

export const LISTER_EMAIL =
  process.env.E2E_LISTER_EMAIL?.trim() || "john.doe@testgoodwill.example";

export const ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL?.trim() || "morgan.hale@testgoodwill.example";

/** Optional hammoq-backend base (e.g. http://localhost:3001). */
export const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL?.trim() || "";

/**
 * Major Admin IMS intake categories (seed in admin-ims defaultAdminImsState).
 * Floor donor create currently defaults category to General Merchandise;
 * category product asserts use Products API with these names.
 */
export const INTAKE_CATEGORIES = [
  "Clothing",
  "Collectibles",
  "Computers & Electronics",
  "Home",
  "Jewelry",
] as const;

export type IntakeCategory = (typeof INTAKE_CATEGORIES)[number];

export function uniqueSku(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${rand}`.slice(0, 40);
}
