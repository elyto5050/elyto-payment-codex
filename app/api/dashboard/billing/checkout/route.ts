import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { BILLING_PLANS } from "@/lib/billing/service";
import { SELF_BILLING_CONFIG } from "@/lib/billing/self-billing";

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user?.id) return apiError("unauthorized", "Sign in required.", 401);

  const body = await request.json().catch(() => ({}));
  const { plan } = body as { plan?: string };
  if (!plan || !(plan in BILLING_PLANS)) return apiError("invalid_plan", "Invalid plan.", 422);

  const planDef = BILLING_PLANS[plan as keyof typeof BILLING_PLANS];
  const amount = planDef.price;
  const paymentRef = `SUB_${session.user.id}_${Date.now()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 1);

  try {
    const payment = await prisma.subscriptionPayment.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email ?? "",
        planTier: plan,
        amount: amount as any,
        paymentRef,
        status: "PENDING",
        expiresAt
      }
    });

    // For local/dev flow return a simple completion URL that simulates provider redirect
    const checkoutUrl = `/api/dashboard/billing/checkout/complete?paymentRef=${encodeURIComponent(paymentRef)}`;
    return apiOk({ checkoutUrl, paymentRef, amount, targetUPI: SELF_BILLING_CONFIG.UPI_DESTINATION, plan });
  } catch (err) {
    return apiError("create_failed", "Failed to create checkout session.", 500);
  }
}
