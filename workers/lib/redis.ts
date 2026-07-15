import Redis from "ioredis";
import { validateWorkerEnv } from "@/workers/lib/env";

let redis: Redis | null = null;

export function getRedisConnection() {
  if (!redis) {
    const env = validateWorkerEnv();
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: false
    });
  }

  return redis;
}

export function getBullMQConnection() {
  return getRedisConnection() as any;
}

export async function closeRedisConnection() {
  if (!redis) return;
  const current = redis;
  redis = null;
  await current.quit().catch(() => current.disconnect());
}
