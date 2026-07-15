import type { JobsOptions } from "bullmq";
import { FAILED_QUEUE_NAMES, QUEUE_NAMES, type QueueKey } from "@/workers/queues/names";

export type QueueRuntimeConfig = {
  key: QueueKey;
  name: string;
  failedQueueName: string;
  concurrency: number;
  defaultJobOptions: JobsOptions;
};

const exponentialBackoff = (attempts: number, delay: number): JobsOptions => ({
  attempts,
  backoff: { type: "exponential", delay },
  removeOnComplete: { age: 86_400, count: 1_000 },
  removeOnFail: { age: 604_800, count: 5_000 }
});

export const QUEUE_CONFIG: Record<QueueKey, QueueRuntimeConfig> = {
  payment: {
    key: "payment",
    name: QUEUE_NAMES.payment,
    failedQueueName: FAILED_QUEUE_NAMES.payment,
    concurrency: Number(process.env.PAYMENT_WORKER_CONCURRENCY ?? 5),
    defaultJobOptions: exponentialBackoff(Number(process.env.PAYMENT_QUEUE_ATTEMPTS ?? 5), 30_000)
  },
  gmail: {
    key: "gmail",
    name: QUEUE_NAMES.gmail,
    failedQueueName: FAILED_QUEUE_NAMES.gmail,
    concurrency: Number(process.env.GMAIL_WORKER_CONCURRENCY ?? 3),
    defaultJobOptions: exponentialBackoff(Number(process.env.GMAIL_QUEUE_ATTEMPTS ?? 3), 60_000)
  },
  webhook: {
    key: "webhook",
    name: QUEUE_NAMES.webhook,
    failedQueueName: FAILED_QUEUE_NAMES.webhook,
    concurrency: Number(process.env.WEBHOOK_WORKER_CONCURRENCY ?? 10),
    defaultJobOptions: exponentialBackoff(Number(process.env.WEBHOOK_QUEUE_ATTEMPTS ?? 8), 5_000)
  },
  analytics: {
    key: "analytics",
    name: QUEUE_NAMES.analytics,
    failedQueueName: FAILED_QUEUE_NAMES.analytics,
    concurrency: Number(process.env.ANALYTICS_WORKER_CONCURRENCY ?? 1),
    defaultJobOptions: exponentialBackoff(Number(process.env.ANALYTICS_QUEUE_ATTEMPTS ?? 2), 120_000)
  },
  billing: {
    key: "billing",
    name: QUEUE_NAMES.billing,
    failedQueueName: FAILED_QUEUE_NAMES.billing,
    concurrency: Number(process.env.BILLING_WORKER_CONCURRENCY ?? 1),
    defaultJobOptions: exponentialBackoff(Number(process.env.BILLING_QUEUE_ATTEMPTS ?? 3), 120_000)
  },
  account: {
    key: "account",
    name: QUEUE_NAMES.account,
    failedQueueName: FAILED_QUEUE_NAMES.account,
    concurrency: Number(process.env.ACCOUNT_WORKER_CONCURRENCY ?? 1),
    defaultJobOptions: exponentialBackoff(Number(process.env.ACCOUNT_QUEUE_ATTEMPTS ?? 3), 300_000)
  }
};

export const queueConfigs = Object.values(QUEUE_CONFIG);
