import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { getBillingInfo, BILLING_PLANS } from "@/lib/billing/service";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.id) return apiError("unauthorized", "Sign in required.", 401);
  // Prefer organization subscription data when available
  const orgId = session.user.organizationId;
  let subscription: any = null;

  if (orgId) {
    const orgSub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
    if (orgSub) {
      // Map verificationLimit to Elyto plan keys
      const mapPlanKey = (limit: number) => {
        if (limit === -1) return "ENTERPRISE";
        if (limit <= 10) return "FREE";
        if (limit <= 100) return "PREMIUM_1";
        if (limit <= 500) return "PREMIUM_2";
        if (limit <= 1000) return "PREMIUM_3";
        return "ENTERPRISE";
      };

      const planKey = mapPlanKey(orgSub.verificationLimit ?? 0);

      subscription = {
        plan: planKey,
        status: orgSub.status?.toLowerCase() ?? "active",
        verificationLimit: orgSub.verificationLimit ?? 0,
        verificationsUsed: orgSub.verificationsUsed ?? 0,
        currentPeriodEnd: orgSub.currentPeriodEnd ?? null,
        maxProjects: BILLING_PLANS[planKey as keyof typeof BILLING_PLANS]?.maxProjects ?? -1
      };
    }
  }

  // Fallback to user billing record if no org subscription
  if (!subscription) {
    const billing = await getBillingInfo(session.user.id);
    const plans: Record<string, { limit: number; label: string }> = {};
    for (const [key, p] of Object.entries(BILLING_PLANS)) {
      plans[key] = { limit: p.maxVerifications === -1 ? 999999 : p.maxVerifications, label: p.name };
    }

    subscription = billing
      ? {
          plan: billing.currentPlan,
          status: billing.isActive ? "active" : "inactive",
          verificationLimit: billing.planName ? billing.maxVerifications : 0,
          verificationsUsed: billing.verificationCount ?? 0,
          currentPeriodEnd: billing.planUpgradedAt ?? null,
          maxProjects: billing.maxProjects ?? 1
        }
      : null;

    return apiOk({ subscription, plans });
  }

  // Provide plans mapping for UI consumption
  const plans: Record<string, { limit: number; label: string }> = {};
  for (const [key, p] of Object.entries(BILLING_PLANS)) {
    plans[key] = { limit: p.maxVerifications === -1 ? 999999 : p.maxVerifications, label: p.name };
  }

  return apiOk({ subscription, plans });
}
