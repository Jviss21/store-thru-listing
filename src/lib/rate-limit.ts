/**
 * Simple in-memory sliding-window rate limiter.
 * Good enough for single-instance / demo; use Upstash Redis for multi-region prod later.
 */

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as {
  __stlRateLimit?: Map<string, Bucket>;
};

function store(): Map<string, Bucket> {
  if (!globalStore.__stlRateLimit) {
    globalStore.__stlRateLimit = new Map();
  }
  return globalStore.__stlRateLimit;
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const map = store();
  const existing = map.get(key);

  if (!existing || existing.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  map.set(key, existing);
  return { ok: true, remaining: limit - existing.count };
}

export function clientIp(request: {
  headers: { get(name: string): string | null };
}): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
