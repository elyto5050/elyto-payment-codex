import { QUEUE_CONFIG } from "@/workers/queues/config";
import { createManagedWorker } from "@/workers/lib/managed-worker";

export function startBillingWorker() {
  return createManagedWorker(QUEUE_CONFIG.billing, async (job) => {
    if (job.name === "reset-subscriptions") {
      const { resetDueSubscriptionsUsage } = await import("@/lib/services/billing");
      return resetDueSubscriptionsUsage();
    }

    return { skipped: true, reason: "unknown_job" };
  });
}
