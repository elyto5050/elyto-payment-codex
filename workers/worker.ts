import "dotenv/config";

import { createLogger } from "@/lib/logger";
import { startHealthServer } from "@/workers/health/server";
import { validateWorkerEnv } from "@/workers/lib/env";
import { registerGracefulShutdown } from "@/workers/lib/shutdown";
import { startAllWorkers } from "@/workers/processors";

const log = createLogger({ process: "worker" });
const isTest = process.env.NODE_ENV === "test" || typeof process.env.JEST_WORKER_ID !== "undefined";

if (isTest) {
  log.info("Test environment detected; workers disabled to avoid open handles.");
} else {
  try {
    const env = validateWorkerEnv();
    const workers = startAllWorkers();
    const server = startHealthServer("worker", env.WORKER_PORT);

    registerGracefulShutdown({ workers, server });

    log.info("Elyto worker process started", {
      queues: workers.map((worker) => worker.name),
      healthPort: env.WORKER_PORT
    });
  } catch (error) {
    log.error("Worker startup failed", { error });
    process.exit(1);
  }
}
