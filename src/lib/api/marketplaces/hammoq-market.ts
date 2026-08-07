/**
 * Hammoq Market channel client — stand-in for eBay until real EBAY_* keys exist.
 *
 * Env (IMS / Vercel):
 *   FAKE_EBAY_API_URL or MARKETPLACE_CHANNEL_URL  → base URL (no trailing slash)
 *   FAKE_EBAY_API_KEY or MARKETPLACE_CHANNEL_API_KEY → Bearer token
 *   FAKE_EBAY_STORE_SLUG (optional, default test-goodwill-west)
 */

export type HammoqMarketConfig = {
  baseUrl: string;
  apiKey: string;
  storeSlug: string;
  configured: boolean;
};

export type HammoqPublishInput = {
  externalId: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  priceCents?: number;
  price?: number;
  sku?: string;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  imageUrls?: string[];
  tags?: string[];
  status?: "ACTIVE" | "DELISTED";
};

export type HammoqPublishResult = {
  ok: true;
  listingId: string;
  externalId: string;
  status: string;
  publicUrl: string;
  absoluteUrl: string;
  upserted?: string;
};

export type HammoqMarketError = {
  ok: false;
  error: string;
  status: number;
  code?: string;
};

function trimSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export function getHammoqMarketConfig(): HammoqMarketConfig {
  const baseUrl = trimSlash(
    (
      process.env.FAKE_EBAY_API_URL ||
      process.env.MARKETPLACE_CHANNEL_URL ||
      ""
    ).trim()
  );
  const apiKey = (
    process.env.FAKE_EBAY_API_KEY ||
    process.env.MARKETPLACE_CHANNEL_API_KEY ||
    ""
  ).trim();
  const storeSlug = (
    process.env.FAKE_EBAY_STORE_SLUG ||
    "test-goodwill-west"
  ).trim();
  return {
    baseUrl,
    apiKey,
    storeSlug,
    configured: Boolean(baseUrl && apiKey),
  };
}

/** Env vars to set when Fake eBay (Hammoq Market) is not configured. */
export function fakeEbayMissingEnv(): string[] {
  const missing: string[] = [];
  const url =
    process.env.FAKE_EBAY_API_URL?.trim() ||
    process.env.MARKETPLACE_CHANNEL_URL?.trim();
  const key =
    process.env.FAKE_EBAY_API_KEY?.trim() ||
    process.env.MARKETPLACE_CHANNEL_API_KEY?.trim();
  if (!url) missing.push("FAKE_EBAY_API_URL (or MARKETPLACE_CHANNEL_URL)");
  if (!key) missing.push("FAKE_EBAY_API_KEY (or MARKETPLACE_CHANNEL_API_KEY)");
  return missing;
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    return body.error || body.message || res.statusText || `HTTP ${res.status}`;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

function absolutePublicUrl(baseUrl: string, publicUrl: string | undefined, listingId: string) {
  const path = publicUrl || `/listing/${listingId}`;
  if (path.startsWith("http")) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Public origin for turning relative photo paths into absolute https URLs. */
export function getPublicAppOrigin(): string | null {
  const explicit =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  if (explicit) return trimSlash(explicit);
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  return null;
}

/**
 * Market requires absolute http(s) image URLs.
 * Relative paths (e.g. /api/photos/...) are rewritten when NEXTAUTH_URL / VERCEL_URL / NEXT_PUBLIC_APP_URL is set.
 */
function ensureImageUrls(input: HammoqPublishInput): string[] {
  const origin = getPublicAppOrigin();
  const urls: string[] = [];
  for (const raw of input.imageUrls || []) {
    if (typeof raw !== "string") continue;
    const u = raw.trim();
    if (!u) continue;
    if (/^https?:\/\//i.test(u)) {
      urls.push(u);
      continue;
    }
    if (origin && u.startsWith("/")) {
      urls.push(`${origin}${u}`);
    }
  }
  if (urls.length) return urls;
  const label = encodeURIComponent((input.sku || input.externalId || "item").slice(0, 24));
  return [`https://placehold.co/800x800/2f4a35/f7faf7/png?text=${label}`];
}

export async function publishToHammoqMarket(
  input: HammoqPublishInput
): Promise<HammoqPublishResult | HammoqMarketError> {
  const cfg = getHammoqMarketConfig();
  if (!cfg.configured) {
    return {
      ok: false,
      error: `Fake eBay (Hammoq Market) not configured. Set: ${fakeEbayMissingEnv().join(", ")}`,
      status: 400,
      code: "NOT_CONFIGURED",
    };
  }

  const payload = {
    externalId: input.externalId,
    storeSlug: cfg.storeSlug,
    title: input.title,
    description: input.description || input.title,
    category: input.category || "General",
    condition: input.condition || "Used - Good",
    brand: input.brand ?? undefined,
    size: input.size ?? undefined,
    color: input.color ?? undefined,
    sku: input.sku ?? undefined,
    priceCents: input.priceCents,
    price: input.priceCents ? undefined : input.price,
    imageUrls: ensureImageUrls(input),
    tags: input.tags,
    listingFormat: "BIN" as const,
    status: input.status,
  };

  try {
    const res = await fetch(`${cfg.baseUrl}/api/v1/listings`, {
      method: "POST",
      headers: authHeaders(cfg.apiKey),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res), status: res.status };
    }
    const data = (await res.json()) as {
      listingId?: string;
      externalId?: string;
      status?: string;
      publicUrl?: string;
      upserted?: string;
      listing?: { id: string; externalId: string; status: string };
    };
    const listingId = data.listingId || data.listing?.id || "";
    const publicUrl = data.publicUrl || (listingId ? `/listing/${listingId}` : "/shop");
    return {
      ok: true,
      listingId,
      externalId: data.externalId || data.listing?.externalId || input.externalId,
      status: data.status || data.listing?.status || "ACTIVE",
      publicUrl,
      absoluteUrl: absolutePublicUrl(cfg.baseUrl, publicUrl, listingId),
      upserted: data.upserted,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Hammoq Market unreachable",
      status: 502,
      code: "UPSTREAM_ERROR",
    };
  }
}

export async function getHammoqMarketListing(
  externalId: string
): Promise<{ ok: true; listing: unknown; publicUrl?: string; absoluteUrl?: string } | HammoqMarketError> {
  const cfg = getHammoqMarketConfig();
  if (!cfg.configured) {
    return {
      ok: false,
      error: `Fake eBay not configured. Set: ${fakeEbayMissingEnv().join(", ")}`,
      status: 400,
      code: "NOT_CONFIGURED",
    };
  }
  try {
    const res = await fetch(
      `${cfg.baseUrl}/api/v1/listings/${encodeURIComponent(externalId)}`,
      { headers: authHeaders(cfg.apiKey), method: "GET" }
    );
    if (!res.ok) {
      return { ok: false, error: await parseError(res), status: res.status };
    }
    const data = (await res.json()) as {
      listing?: { id: string };
      publicUrl?: string;
    };
    const listingId = data.listing?.id || "";
    const publicUrl = data.publicUrl;
    return {
      ok: true,
      listing: data.listing,
      publicUrl,
      absoluteUrl: listingId
        ? absolutePublicUrl(cfg.baseUrl, publicUrl, listingId)
        : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Hammoq Market unreachable",
      status: 502,
      code: "UPSTREAM_ERROR",
    };
  }
}

export async function delistOnHammoqMarket(
  externalId: string,
  reason?: string
): Promise<{ ok: true; listing: unknown } | HammoqMarketError> {
  const cfg = getHammoqMarketConfig();
  if (!cfg.configured) {
    return {
      ok: false,
      error: `Fake eBay not configured. Set: ${fakeEbayMissingEnv().join(", ")}`,
      status: 400,
      code: "NOT_CONFIGURED",
    };
  }
  try {
    const res = await fetch(
      `${cfg.baseUrl}/api/v1/listings/${encodeURIComponent(externalId)}/delist`,
      {
        method: "POST",
        headers: authHeaders(cfg.apiKey),
        body: JSON.stringify({ reason: reason || "Ended by IMS" }),
      }
    );
    if (!res.ok) {
      return { ok: false, error: await parseError(res), status: res.status };
    }
    const data = (await res.json()) as { listing?: unknown };
    return { ok: true, listing: data.listing };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Hammoq Market unreachable",
      status: 502,
      code: "UPSTREAM_ERROR",
    };
  }
}

/**
 * Item sold on eBay (or another channel) → remove from Hammoq Market storefront.
 * Maps to end-on-sale simulation when Fake eBay is the stand-in.
 */
export async function soldOnHammoqMarket(
  externalId: string,
  opts?: { channel?: string; reason?: string; orderId?: string }
): Promise<{ ok: true; listing: unknown; conflict?: boolean; note?: string } | HammoqMarketError> {
  const cfg = getHammoqMarketConfig();
  if (!cfg.configured) {
    return {
      ok: false,
      error: `Fake eBay not configured. Set: ${fakeEbayMissingEnv().join(", ")}`,
      status: 400,
      code: "NOT_CONFIGURED",
    };
  }
  try {
    const res = await fetch(
      `${cfg.baseUrl}/api/v1/listings/${encodeURIComponent(externalId)}/sold`,
      {
        method: "POST",
        headers: authHeaders(cfg.apiKey),
        body: JSON.stringify({
          channel: opts?.channel || "eBay",
          reason: opts?.reason,
          orderId: opts?.orderId,
        }),
      }
    );
    const data = (await res.json().catch(() => ({}))) as {
      listing?: unknown;
      conflict?: boolean;
      note?: string;
      error?: string;
    };
    if (res.status === 409) {
      return {
        ok: true,
        listing: data.listing,
        conflict: true,
        note: data.note || "Conflict with Hammoq Market sale",
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || res.statusText || `HTTP ${res.status}`,
        status: res.status,
      };
    }
    return { ok: true, listing: data.listing, note: data.note };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Hammoq Market unreachable",
      status: 502,
      code: "UPSTREAM_ERROR",
    };
  }
}
