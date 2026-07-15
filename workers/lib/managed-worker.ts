import { Worker, type Job } from "bullmq";
import { getBullMQConnection } from "@/workers/lib/redis";
import { getJobLogContext } from "@/workers/lib/job-context";
import { moveToDeadLetterQueue } from "@/workers/queues/dead-letter";
import type { QueueRuntimeConfig } from "@/workers/queues/config";
import { createQueueLogger } from "@/workers/logger/worker-logger";

export function createManagedWorker<T = unknown>(config: QueueRuntimeConfig, processor: (job: Job<T>) => Promise<unknown>) {
  const log = createQueueLogger(config.name);

  const worker = new Worker<T>(
    config.name,
    async (job) => {
      const startedAt = Date.now();
      const context = getJobLogContext(job);
      log.info("Job started", { ...context, status: "started" });

      try {
        const result = await processor(job);
        log.info("Job completed", {
          ...context,
          executionTime: Date.now() - startedAt,
          status: "completed"
        });
        return result;
      } catch (error) {
        log.error("Job failed", {
          ...context,
          executionTime: Date.now() - startedAt,
          status: "failed",
          error
        });
        throw error;
      }
    },
    {
      connection: getBullMQConnection(),
      concurrency: config.concurrency,
      autorun: true
    }
  );

  worker.on("failed", async (job, error) => {
    log.warn("Worker observed failed job", {
      ...(job ? getJobLogContext(job) : {}),
      status: "failed",
      error
    });

    await moveToDeadLetterQueue(config, job, error).catch((dlqError) => {
      log.error("Failed to move job to dead-letter queue", {
        ...(job ? getJobLogContext(job) : {}),
        error: dlqError
      });
    });
  });

  worker.on("error", (error) => {
    log.error("Worker runtime error", { error });
  });

  worker.on("ready", () => {
    log.info("Worker ready", { status: "ready", concurrency: config.concurrency });
  });

  return worker;
}
