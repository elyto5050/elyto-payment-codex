import type { Job } from "bullmq";
import { verifyOrderByUtr } from "@/lib/services/verification";
import { QUEUE_CONFIG } from "@/workers/queues/config";
import { createManagedWorker } from "@/workers/lib/managed-worker";
import type { PaymentVerificationJob } from "@/workers/types/jobs";

export function startPaymentWorker() {
  return createManagedWorker<PaymentVerificationJob>(QUEUE_CONFIG.payment, async (job: Job<PaymentVerificationJob>) => {
    const result = await verifyOrderByUtr(job.data.orderPublicId);
    if (!result.verified && "retry" in result && result.retry) {
      throw new Error(result.reason);
    }
    return result;
  });
}
