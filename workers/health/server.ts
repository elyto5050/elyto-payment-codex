import http from "node:http";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logger";
import { collectQueueMetrics, collectRuntimeMetrics } from "@/workers/monitoring/metrics";
import { getRedisConnection } from "@/workers/lib/redis";

const log = createLogger({ component: "health" });
const startedAt = Date.now();

async function getHealthPayload() {
  const [queues, redis, database] = await Promise.allSettled([
    collectQueueMetrics(),
    getRedisConnection().ping(),
    prisma.$queryRaw`SELECT 1`
  ]);

  const redisConnected = redis.status === "fulfilled";
  const databaseConnected = database.status === "fulfilled";

  return {
    payload: {
      status: redisConnected && databaseConnected ? "healthy" : "unhealthy",
      queues: queues.status === "fulfilled" ? queues.value : [],
      redis: redisConnected ? "connected" : "disconnected",
      database: databaseConnected ? "connected" : "disconnected",
      uptime: Math.floor((Date.now() - startedAt) / 1000)
    },
    statusCode: redisConnected && databaseConnected ? 200 : 503
  };
}

export function startHealthServer(processName: "worker" | "scheduler", port: number) {
  const server = http.createServer(async (request, response) => {
    response.setHeader("content-type", "application/json");

    try {
      if (request.url === "/health") {
        const { payload, statusCode } = await getHealthPayload();
        response.writeHead(statusCode);
        response.end(JSON.stringify(payload));
        return;
      }

      if (request.url === "/metrics") {
        response.writeHead(200);
        response.end(JSON.stringify(await collectRuntimeMetrics(processName)));
        return;
      }

      response.writeHead(404);
      response.end(JSON.stringify({ error: "not_found" }));
    } catch (error) {
      log.error("Health server request failed", { error });
      response.writeHead(500);
      response.end(JSON.stringify({ status: "unhealthy", error: "health_check_failed" }));
    }
  });

  server.listen(port, () => {
    log.info("Health server listening", { process: processName, port });
  });

  return server;
}
