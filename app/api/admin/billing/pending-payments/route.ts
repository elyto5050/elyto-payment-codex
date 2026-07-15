import { NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { isPlatformOwnerUser } from "@/lib/platform-owner";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user?.id) return apiError("unauthorized", "Sign in required.", 401);
  const isOwner = await isPlatformOwnerUser(session.user.id, session.user.email);
  if (!isOwner) return apiError("forbidden", "Owner access required.", 403);

  const payments = await prisma.subscriptionPayment.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return apiOk({ payments });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user?.id) return apiError("unauthorized", "Sign in required.", 401);
  const isOwner = await isPlatformOwnerUser(session.user.id, session.user.email);
  if (!isOwner) return apiError("forbidden", "Owner access required.", 403);

  const body = await request.json();
  const { paymentId, transactionHash } = body ?? {};
  if (!paymentId || !transactionHash) return apiError("invalid_request", "paymentId and transactionHash required.", 422);

  const payment = await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
  if (!payment) return apiError("not_found", "Payment not found.", 404);
  if (payment.status !== "PENDING") return apiError("invalid_request", "Payment not pending.", 422);

  // call internal verification handler
  try {
    const { handleSubscriptionPaymentWebhook, SELF_BILLING_CONFIG } = await import("@/lib/billing/self-billing");
    const tx = await prisma.transaction.findUnique({ where: { id: transactionHash } });

    const result = await handleSubscriptionPaymentWebhook({
      from: tx?.sender ?? payment.userEmail,
      to: SELF_BILLING_CONFIG.UPI_DESTINATION,
      amount: Number(payment.amount),
      transactionHash: transactionHash,
      paymentRef: payment.paymentRef,
      timestamp: (tx?.receivedAt ?? new Date()).toISOString()
    } as any);

    if (result?.success) return apiOk({ success: true });
    return apiOk({ success: false, message: "Verification handler returned non-success." });
  } catch (err) {
    return apiError("server_error", "Verification attempt failed.", 500);
  }
}
