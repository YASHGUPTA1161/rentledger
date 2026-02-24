/**
 * lib/cache.ts — Redis caching helpers with graceful degradation
 *
 * KEY DESIGN PRINCIPLE:
 *   Redis is an OPTIONAL speed layer. If it goes down (Upstash free tier
 *   pauses after 14 days of inactivity), every function here falls back
 *   to returning null silently. Callers then fetch from DB directly.
 *
 *   Redis UP:   get() → cached value (~1ms)
 *   Redis DOWN: get() → null → caller hits DB (~30ms) → SaaS still works
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

// Lazily initialize — if env vars are missing, redis stays null
// and all functions become no-ops
function getRedis(): Redis | null {
  if (redis) return redis;
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redis;
  } catch {
    return null;
  }
}

// ── Cache key builders ────────────────────────────────────────────────────────
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  unread: (userId: string) => `unread:${userId}`,
  tenants: (landlordId: string) => `tenants:${landlordId}`,
};

// ── TTLs (seconds) ───────────────────────────────────────────────────────────
export const TTL = {
  user: 5 * 60, // 5 min — name/email rarely changes
  unread: 30, // 30 sec — changes after send/read
  tenants: 5 * 60, // 5 min — changes on invite/end tenancy
};

/**
 * Get a cached value.
 * Returns null if: cache miss, Redis down, or parse error.
 * Caller should always be prepared to fetch from DB when null is returned.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get<T>(key);
  } catch {
    // Redis down, paused, or network error — degrade silently
    return null;
  }
}

/**
 * Store a value in cache.
 * Silent no-op if Redis is down — the SaaS continues without caching.
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch {
    // Redis down — skip caching, data just won't be cached this time
    return;
  }
}

/**
 * Delete a cache key (used for invalidation after mutations).
 * Silent no-op if Redis is down — old cache just serves until TTL expires.
 */
export async function cacheDelete(...keys: string[]): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    if (keys.length > 0) await client.del(...keys);
  } catch {
    return;
  }
}

/**
 * Convenience: get from cache, or fetch from DB and store result.
 *
 * Usage:
 *   const user = await withCache(
 *     CacheKeys.user(userId),
 *     TTL.user,
 *     () => db.user.findUnique({ where: { id: userId } })
 *   );
 *
 * If Redis is down at any point, fetcher() runs directly without caching.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  // Cache miss or Redis down → run the real query
  const fresh = await fetcher();

  // Store result (silent no-op if Redis is down)
  if (fresh !== null && fresh !== undefined) {
    await cacheSet(key, fresh, ttlSeconds);
  }

  return fresh;
}
