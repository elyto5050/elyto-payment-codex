import Redis from "ioredis";

const memory = new Map<string, { count: number; resetAt: number }>();

let redis: Redis | null = null;

function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
    redis.connect().catch(() => {
      redis = null;
    });
  }
  return redis;
}

export async function checkRateLimit(key: string, limit = 60, windowMs = 60_000) {
  const client = getRedis();
  const now = Date.now();

  if (client) {
    try {
      const redisKey = `ratelimit:${key}`;
      const count = await client.incr(redisKey);
      if (count === 1) {
        await client.pexpire(redisKey, windowMs);
      }
      const ttl = await client.pttl(redisKey);
      const resetAt = now + (ttl > 0 ? ttl : windowMs);
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt
      };
    } catch {
      // fall through to memory
    }
  }

  const record = memory.get(key);
  if (!record || record.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}
