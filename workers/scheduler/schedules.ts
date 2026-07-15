import { Queue } from "bullmq";
import { QUEUE_CONFIG } from "@/workers/queues/config";
import { getBullMQConnection } from "@/workers/lib/redis";

const scheduledQueues = new Map<string, Queue>();

function getQueue(name: string) {
  const existing = scheduledQueues.get(name);
  if (existing) return existing;

  const queue = new Queue(name, { connection: getBullMQConnection() });
  scheduledQueues.set(name, queue);
  return queue;
}

export async function registerSchedules() {
  await getQueue(QUEUE_CONFIG.gmail.name).add("sync-all", {}, {
    ...QUEUE_CONFIG.gmail.defaultJobOptions,
    repeat: { pattern: process.env.GMAIL_SYNC_CRON ?? "*/10 * * * *" },
    jobId: "gmail-sync-all"
  });

  await getQueue(QUEUE_CONFIG.analytics.name).add("aggregate-daily", {}, {
    ...QUEUE_CONFIG.analytics.defaultJobOptions,
    repeat: { pattern: process.env.ANALYTICS_CRON ?? "0 0 * * *" },
    jobId: "analytics-daily"
  });

  await getQueue(QUEUE_CONFIG.billing.name).add("reset-subscriptions", {}, {
    ...QUEUE_CONFIG.billing.defaultJobOptions,
    repeat: { pattern: process.env.BILLING_RESET_CRON ?? "0 2 * * *" },
    jobId: "billing-reset-daily"
  });
}

export async function closeScheduledQueues() {
  const queues = [...scheduledQueues.values()];
  scheduledQueues.clear();
  await Promise.allSettled(queues.map((queue) => queue.close()));
}
