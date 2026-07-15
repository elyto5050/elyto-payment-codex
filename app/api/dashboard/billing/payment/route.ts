import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { BILLING_PLANS } from "@/lib/billing/service";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user?.id) return apiError("unauthorized", "Sign in required.", 401);

  const paymentRef = request.nextUrl.searchParams.get("paymentRef");
  let payment = null;

  if (paymentRef) {
    payment = await prisma.subscriptionPayment.findUnique({ where: { paymentRef } });
    if (!payment) return apiError("not_found", "Payment not found.", 404);
    if (payment.userId !== session.user.id) return apiError("forbidden", "Not allowed.", 403);
  } else {
    // No paymentRef provided — return the latest pending payment for this user
    payment = await prisma.subscriptionPayment.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) return apiError("not_found", "No pending payment found.", 404);
  }

  return apiOk({
    paymentRef: payment.paymentRef,
    amount: Number(payment.amount),
    targetUPI: payment.targetUPI ?? "aviralji@fam",
    plan: payment.planTier,
    status: payment.status,
    submittedUtr: payment.submittedUtr ?? null,
    expiresAt: payment.expiresAt ?? null,
    planDef: BILLING_PLANS[payment.planTier as keyof typeof BILLING_PLANS] ?? null,
  });
}
