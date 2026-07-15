import { QUEUE_CONFIG } from "@/workers/queues/config";
import { createManagedWorker } from "@/workers/lib/managed-worker";

export function startAnalyticsWorker() {
  return createManagedWorker(QUEUE_CONFIG.analytics, async () => {
    const { aggregateDailyMetrics } = await import("@/lib/services/analytics");
    await aggregateDailyMetrics();
    return { aggregated: true };
  });
}
