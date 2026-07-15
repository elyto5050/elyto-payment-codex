import { Queue } from "bullmq";
import { logger } from "@/lib/logger";
import { QUEUE_CONFIG } from "@/workers/queues/config";
import { QUEUE_NAMES } from "@/workers/queues/names";

const isTest = process.env.NODE_ENV === "test" || typeof process.env.JEST_WORKER_ID !== "undefined";

type Queues =
  | {
      gmailSync: Queue;
      paymentVerification: Queue;
      webhookDelivery: Queue;
      notification: Queue;
      analytics: Queue;
      accountDeletion: Queue;
    }
  | null;

export let queues: Queues = null;

if (isTest) {
  logger.info("Test environment detected — queues disabled to avoid open handles.");
  queues = null;
} else {
  const connection = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL, maxRetriesPerRequest: null }
    : undefined;

  function createQueueSafe(name: string) {
    if (!connection) return undefined;
    try {
      const config = Object.values(QUEUE_CONFIG).find((entry) => entry.name === name);
      return new Queue(name, { connection, defaultJobOptions: config?.defaultJobOptions });
    } catch (err) {
      logger.error(`Failed to initialize queue ${name}`, { error: err instanceof Error ? err.message : String(err) });
      return undefined;
    }
  }

  if (connection) {
    const gmailSync = createQueueSafe(QUEUE_NAMES.gmail);
    const paymentVerification = createQueueSafe(QUEUE_NAMES.payment);
    const webhookDelivery = createQueueSafe(QUEUE_NAMES.webhook);
    const notification = createQueueSafe(QUEUE_NAMES.notification);
    const analytics = createQueueSafe(QUEUE_NAMES.analytics);
    const accountDeletion = createQueueSafe(QUEUE_NAMES.account);

    if (gmailSync && paymentVerification && webhookDelivery && notification && analytics && accountDeletion) {
      queues = { gmailSync, paymentVerification, webhookDelivery, notification, analytics, accountDeletion };
    } else {
      logger.warn("One or more queues failed to initialize; falling back to null queues.");
      queues = null;
    }
  } else {
    queues = null;
  }
}
