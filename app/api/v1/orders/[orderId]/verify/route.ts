import { apiError, apiOk } from "@/lib/api/response";
import { submitOrderUtr } from "@/lib/services/orders";
import { verifyOrderSchema } from "@/lib/validators/orders";
import { queues } from "@/lib/queues";
import { logger } from "@/lib/logger";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const body = await request.json();
  const parsed = verifyOrderSchema.safeParse({ ...body, orderId });

  if (!parsed.success) {
    return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);
  }

  const order = await submitOrderUtr(parsed.data.orderId, parsed.data.utr);

  if (queues) {
    try {
      await queues.paymentVerification.add("verify-order", { orderPublicId: order.publicId }, { attempts: 5, backoff: { type: "exponential", delay: 30_000 } });
    } catch (err) {
      logger.warn("Failed to enqueue verification job; attempting local verification", { error: err instanceof Error ? err.message : String(err), orderPublicId: order.publicId });
      try {
        const { verifyOrderByUtr } = await import("@/lib/services/verification");
        await verifyOrderByUtr(order.publicId);
      } catch (err2) {
        logger.warn("Local verification fallback failed", { error: err2 instanceof Error ? err2.message : String(err2), orderPublicId: order.publicId });
      }
    }
  } else {
    // No queue backend available; attempt immediate verification to avoid indefinite waits
    try {
      const { verifyOrderByUtr } = await import("@/lib/services/verification");
      await verifyOrderByUtr(order.publicId);
    } catch (err) {
      logger.warn("Local verification fallback failed (no queues)", { error: err instanceof Error ? err.message : String(err), orderPublicId: order.publicId });
    }
  }

  return apiOk({ id: order.publicId, status: order.status });
}
