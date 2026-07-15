/**
 * Simple in-memory TTL cache for server-side short-lived caching.
 * Not distributed — intended for single-process dev/prod workers only.
 */
type CacheEntry = { value: unknown; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5_000; // 5s

export function cacheGet<T = any>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number = DEFAULT_TTL) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDel(key: string) {
  cache.delete(key);
}

export function cacheClear() {
  cache.clear();
}

// Periodic cleanup to avoid unbounded memory growth in long-running processes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (v.expiresAt <= now) cache.delete(k);
    }
  }, 60_000).unref?.();
}

export default { cacheGet, cacheSet, cacheDel, cacheClear };
