import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { upgradePlan } from "@/lib/billing/service";
import { PLANS } from "@/lib/plans";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL(`/login?callbackUrl=/dashboard/billing`, request.url));

  const url = new URL(request.url);
  const paymentRef = url.searchParams.get("paymentRef");
  if (!paymentRef) return NextResponse.redirect(new URL(`/dashboard/billing?checkout=failed`, request.url));

  const payment = await prisma.subscriptionPayment.findUnique({ where: { paymentRef } });
  if (!payment) return NextResponse.redirect(new URL(`/dashboard/billing?checkout=not_found`, request.url));

  if (payment.status === "VERIFIED") return NextResponse.redirect(new URL(`/dashboard/billing?checkout=already`, request.url));

  // Mark verified
  await prisma.subscriptionPayment.update({ where: { id: payment.id }, data: { status: "VERIFIED", verifiedAt: new Date() } });

  try {
    // Upgrade user billing record
    await upgradePlan(session.user.id, payment.planTier as any);

    // Update/create organization subscription to reflect new limits
    const orgId = session.user.organizationId;
    const planKey = payment.planTier;

    // Use centralized PLANS mapping for verification limits
    const verificationLimit = (PLANS as any)[planKey]?.maxVerifications ?? 500;

    if (orgId) {
      const existing = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
      if (existing) {
        await prisma.subscription.update({ where: { organizationId: orgId }, data: { verificationLimit } });
      } else {
        await prisma.subscription.create({ data: { organizationId: orgId, plan: "STARTER", status: "ACTIVE", verificationLimit, verificationsUsed: 0 } as any });
      }
    }
  } catch (err) {
    // ignore errors and continue to redirect
    console.error("Checkout complete error:", err);
  }

  return NextResponse.redirect(new URL(`/dashboard/billing?checkout=success`, request.url));
}
