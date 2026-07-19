import type { Job } from "bullmq";
import { verifyOrderByUtr } from "@/lib/services/verification";
import { verifySubscriptionPaymentByUtr } from "@/lib/billing/self-billing";
import { QUEUE_CONFIG } from "@/workers/queues/config";
import { createManagedWorker } from "@/workers/lib/managed-worker";
import type { PaymentVerificationJob } from "@/workers/types/jobs";

export async function processPaymentVerificationJob(job: Job<PaymentVerificationJob>) {
  if (job.name === "verify-subscription-payment") {
    const result = await verifySubscriptionPaymentByUtr({
      paymentId: job.data.paymentId,
      paymentRef: job.data.paymentRef,
      submittedUtr: job.data.submittedUtr
    });

    if (!result.verified && "retry" in result && result.retry) {
      throw new Error(result.reason);
    }

    return result;
  }

  if (!job.data.orderPublicId) {
    throw new Error("missing_order_public_id");
  }

  const result = await verifyOrderByUtr(job.data.orderPublicId);
  if (!result.verified && "retry" in result && result.retry) {
    throw new Error(result.reason);
  }
  return result;
}

export function startPaymentWorker() {
  return createManagedWorker<PaymentVerificationJob>(QUEUE_CONFIG.payment, processPaymentVerificationJob);
}
