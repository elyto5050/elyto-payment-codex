import type { Job } from "bullmq";
import { deliverWebhookEvent } from "@/lib/services/webhooks";
import { QUEUE_CONFIG } from "@/workers/queues/config";
import { createManagedWorker } from "@/workers/lib/managed-worker";
import type { WebhookDeliveryJob } from "@/workers/types/jobs";

export function startWebhookWorker() {
  return createManagedWorker<WebhookDeliveryJob>(QUEUE_CONFIG.webhook, async (job: Job<WebhookDeliveryJob>) => {
    const result = await deliverWebhookEvent(job.data.eventId);
    if (!result.delivered && result.reason !== "no_endpoints") {
      throw new Error(result.reason ?? "delivery_failed");
    }
    return result;
  });
}
