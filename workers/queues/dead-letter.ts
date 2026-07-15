import { Queue, type Job } from "bullmq";
import { getBullMQConnection } from "@/workers/lib/redis";
import type { QueueRuntimeConfig } from "@/workers/queues/config";

const failedQueues = new Map<string, Queue>();

function getFailedQueue(name: string) {
  const existing = failedQueues.get(name);
  if (existing) return existing;

  const queue = new Queue(name, {
    connection: getBullMQConnection(),
    defaultJobOptions: {
      removeOnComplete: { age: 2_592_000, count: 10_000 },
      removeOnFail: { age: 2_592_000, count: 10_000 }
    }
  });
  failedQueues.set(name, queue);
  return queue;
}

export async function moveToDeadLetterQueue(config: QueueRuntimeConfig, job: Job | undefined, error: Error) {
  if (!job) return;

  const attemptsAllowed = Number(job.opts.attempts ?? config.defaultJobOptions.attempts ?? 1);
  if (job.attemptsMade < attemptsAllowed) return;

  const failedQueue = getFailedQueue(config.failedQueueName);
  await failedQueue.add(
    "failed",
    {
      originalQueue: config.name,
      originalJobName: job.name,
      originalJobId: job.id,
      failedAt: new Date().toISOString(),
      reason: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
      attemptsMade: job.attemptsMade,
      data: job.data
    },
    {
      jobId: `${config.name}:${job.id}:${job.attemptsMade}`,
      removeOnComplete: false,
      removeOnFail: false
    }
  );
}

export async function closeDeadLetterQueues() {
  const queues = [...failedQueues.values()];
  failedQueues.clear();
  await Promise.allSettled(queues.map((queue) => queue.close()));
}
