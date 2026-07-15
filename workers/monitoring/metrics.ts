import os from "node:os";
import { Queue } from "bullmq";
import { prisma } from "@/lib/db/prisma";
import { queueConfigs } from "@/workers/queues/config";
import { getBullMQConnection, getRedisConnection } from "@/workers/lib/redis";

const startedAt = Date.now();
let lastCpuUsage = process.cpuUsage();

async function measureLatency(operation: () => Promise<unknown>) {
  const started = Date.now();
  await operation();
  return Date.now() - started;
}

export async function collectQueueMetrics() {
  const connection = getBullMQConnection();
  const queues = queueConfigs.map((config) => new Queue(config.name, { connection }));

  try {
    return await Promise.all(
      queues.map(async (queue) => {
        const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused");
        return {
          name: queue.name,
          size: counts.waiting + counts.delayed,
          waiting: counts.waiting,
          processing: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
          paused: counts.paused
        };
      })
    );
  } finally {
    await Promise.allSettled(queues.map((queue) => queue.close()));
  }
}

export async function collectRuntimeMetrics(processName: "worker" | "scheduler") {
  const currentCpu = process.cpuUsage(lastCpuUsage);
  lastCpuUsage = process.cpuUsage();

  const [queues, redisLatency, databaseLatency] = await Promise.all([
    collectQueueMetrics(),
    measureLatency(async () => {
      await getRedisConnection().ping();
    }),
    measureLatency(async () => {
      await prisma.$queryRaw`SELECT 1`;
    })
  ]);

  return {
    process: processName,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    queues,
    redisLatency,
    databaseLatency,
    memory: process.memoryUsage(),
    cpu: {
      userMicros: currentCpu.user,
      systemMicros: currentCpu.system,
      loadAverage: os.loadavg()
    }
  };
}
