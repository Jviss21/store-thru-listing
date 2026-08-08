/**
 * Optional remote backend base URL for gradual cutover to hammoq-backend.
 * When unset, IMS keeps using same-origin `/api/*` (Vercel-safe).
 */

export function getApiBaseUrl(): string | null {
  const raw =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "";
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

/** Build an absolute URL for a path (`/api/v1/products` or `/api/products`). */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  // Prefer v1 on remote backend when caller passes legacy /api/foo
  if (base && p.startsWith("/api/") && !p.startsWith("/api/v1/")) {
    // leave path as-is; callers should migrate to /api/v1 explicitly
  }
  return `${base}${p}`;
}

export function usesRemoteBackend(): boolean {
  return getApiBaseUrl() !== null;
}
