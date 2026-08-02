/** Shared demo access helpers (Edge + Node safe). */

export const DEMO_COOKIE = "stl_demo_access";

/** Default used when DEMO_PASSWORD is unset in local/dev docs — production must set env. */
export const DEFAULT_DEMO_PASSWORD = "testgoodwill";

export async function demoSessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`store-thru-listing:demo:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function resolvedDemoPassword(): string {
  return process.env.DEMO_PASSWORD?.trim() || DEFAULT_DEMO_PASSWORD;
}
