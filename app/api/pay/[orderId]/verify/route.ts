import { apiError, apiOk } from "@/lib/api/response";
import { submitOrderUtr } from "@/lib/services/orders";
import { verifyOrderSchema } from "@/lib/validators/orders";
import { queues } from "@/lib/queues";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const rateLimit = await checkRateLimit(`pay:${ip}`, 30);
  if (!rateLimit.allowed) {
    return apiError("rate_limited", "Too many attempts. Please wait.", 429);
  }

  const orderRateLimit = await checkRateLimit(`pay:order:${orderId}`, 8, 30 * 60_000);
  if (!orderRateLimit.allowed) {
    return apiError("rate_limited", "Too many attempts for this order. Please wait.", 429);
  }

  const body = await request.json();
  const parsed = verifyOrderSchema.safeParse({ ...body, orderId });

  if (!parsed.success) {
    return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);
  }

  try {
    const order = await submitOrderUtr(parsed.data.orderId, parsed.data.utr);

    if (queues) {
      await queues.paymentVerification.add(
        "verify-order",
        { orderPublicId: order.publicId },
        { attempts: 8, backoff: { type: "exponential", delay: 15_000 } }
      );
    }

    return apiOk({ id: order.publicId, status: order.status });
  } catch (error) {
    return apiError("invalid_utr", error instanceof Error ? error.message : "Invalid UTR.", 422);
  }
}
