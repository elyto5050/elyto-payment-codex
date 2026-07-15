import { NextRequest } from "next/server";
import { TeamRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession, requireOrgAccess } from "@/lib/api/middleware";
import { BILLING_PLANS, upgradePlan } from "@/lib/billing/service";

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user?.id) return apiError("unauthorized", "Sign in required.", 401);

  const orgId = session.user.organizationId;
  if (!orgId) return apiError("no_org", "Organization required.", 400);

  try {
    await requireOrgAccess(session.user.id, orgId, TeamRole.MANAGER);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const body = await request.json().catch(() => ({}));
  const { plan } = body as { plan?: string };
  if (!plan || !(plan in BILLING_PLANS)) return apiError("invalid_plan", "Invalid plan.", 422);

  try {
    // Upgrade user billing record
    await upgradePlan(session.user.id, plan as any);

    // Update or create organization subscription to reflect new limits
    const planDef = BILLING_PLANS[plan as keyof typeof BILLING_PLANS];
    const verificationLimit = planDef.maxVerifications === -1 ? -1 : planDef.maxVerifications;

    const existing = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
    if (existing) {
      await prisma.subscription.update({ where: { organizationId: orgId }, data: { verificationLimit } });
    } else {
      await prisma.subscription.create({ data: { organizationId: orgId, plan: "STARTER", status: "ACTIVE", verificationLimit, verificationsUsed: 0 } as any });
    }

    return apiOk({ success: true });
  } catch (err) {
    return apiError("upgrade_failed", "Failed to upgrade plan.", 500);
  }
}
