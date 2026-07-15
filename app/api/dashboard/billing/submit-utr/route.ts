import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { handleSubscriptionPaymentWebhook, SELF_BILLING_CONFIG } from "@/lib/billing/self-billing";
import { queues } from "@/lib/queues";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user?.id) return apiError("unauthorized", "Sign in required.", 401);

  const body = await request.json();
  const paymentRef = body?.paymentRef;
  const utr = body?.utr;
  const transactionId = body?.transactionId;
  const screenshot = body?.screenshot;

  if (!paymentRef || !utr) return apiError("invalid_request", "paymentRef and utr required.", 422);

  const payment = await prisma.subscriptionPayment.findUnique({ where: { paymentRef } });
  if (!payment) return apiError("not_found", "Payment not found.", 404);
  if (payment.userId !== session.user.id) return apiError("forbidden", "Not allowed.", 403);
  if (payment.status !== "PENDING") return apiError("invalid_request", "Payment not pending.", 422);
  if (payment.expiresAt && payment.expiresAt < new Date()) return apiError("expired", "Payment expired.", 410);

  // Persist submitted UTR and optional transactionId/screenshot
  await prisma.subscriptionPayment.update({ where: { id: payment.id }, data: { submittedUtr: utr, submittedTransactionId: transactionId ?? null, submittedScreenshot: screenshot ?? null } });

  // Try to find a matching transaction already synced from Gmail
  const tx = await prisma.transaction.findFirst({
    where: { utr, amount: payment.amount },
    orderBy: { receivedAt: "desc" }
  });

  if (!tx) {
    // If the job-worker or Redis-backed queues are not available, return 503 so the UI shows a clear error
    if (!process.env.REDIS_URL || !queues) {
      logger.warn("submit-utr: verification backend unavailable", { paymentRef, redisUrl: !!process.env.REDIS_URL, queuesInitialized: !!queues });
      return apiError("service_unavailable", "Verification service temporarily unavailable. Please try again later.", 503);
    }

    return apiOk({ matched: false, message: "UTR recorded; awaiting Gmail confirmation." });
  }

  // Attempt automated verification using the found transaction
  try {
    const result = await handleSubscriptionPaymentWebhook({
      from: tx.sender ?? payment.userEmail,
      to: SELF_BILLING_CONFIG.UPI_DESTINATION,
      amount: Number(tx.amount),
      transactionHash: tx.emailMessageId ?? tx.id,
      paymentRef: payment.paymentRef,
      timestamp: tx.receivedAt.toISOString()
    } as any);

    if (result?.success) {
      // Return the detailed result so the client can confirm DB records match
      return apiOk({ matched: true, message: "Subscription payment verified.", result });
    }

    return apiOk({ matched: false, message: "Found transaction but verification failed." });
  } catch (err) {
    return apiOk({ matched: false, message: "Verification attempt failed, will retry when Gmail sync runs." });
  }
}
