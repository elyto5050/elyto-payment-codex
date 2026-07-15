import type http from "node:http";
import type { Worker } from "bullmq";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logger";
import { closeDeadLetterQueues } from "@/workers/queues/dead-letter";
import { closeRedisConnection } from "@/workers/lib/redis";

const log = createLogger({ component: "shutdown" });

export function registerGracefulShutdown(options: {
  workers?: Worker[];
  server?: http.Server;
  close?: Array<() => Promise<unknown>>;
}) {
  let shuttingDown = false;

  async function shutdown(signal: NodeJS.Signals) {
    if (shuttingDown) return;
    shuttingDown = true;

    log.warn("Graceful shutdown started", { signal });

    const timeout = setTimeout(() => {
      log.error("Graceful shutdown timed out", { signal });
      process.exit(1);
    }, 30_000);
    timeout.unref();

    try {
      await Promise.allSettled(options.workers?.map((worker) => worker.close()) ?? []);
      await Promise.allSettled(options.close?.map((close) => close()) ?? []);
      await closeDeadLetterQueues();
      await closeRedisConnection();
      await prisma.$disconnect();

      if (options.server) {
        await new Promise<void>((resolve) => options.server?.close(() => resolve()));
      }

      log.info("Graceful shutdown completed", { signal });
      process.exit(0);
    } catch (error) {
      log.error("Graceful shutdown failed", { signal, error });
      process.exit(1);
    }
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
