import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { initializeBillingRecord } from "@/lib/billing/service";
import { PLANS } from "@/lib/plans";
import { SubscriptionStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, profession, monthlyVolume } = body;

    if (!firstName || !lastName || !profession || monthlyVolume === undefined) {
      return NextResponse.json(
        { error: { message: "Missing required fields" } },
        { status: 400 }
      );
    }

    // Update user profile (store onboarding fields and mark complete)
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        profession,
        expectedMonthlyVolume: typeof monthlyVolume === "number" ? monthlyVolume : null,
        onboardingCompleted: true,
        // keep legacy company field populated for backwards compatibility
        company: profession
      }
    });

    // Ensure billing record exists (uses canonical initializer)
    await initializeBillingRecord(session.user.id, user.email);

    // Ensure organization subscription exists and is set to FREE/STARTER limits
    // Determine organization to attach subscription to (owner or first team member org)
    let organizationId: string | null = null;
    const orgByOwner = await prisma.organization.findFirst({ where: { ownerId: session.user.id } });
    if (orgByOwner) {
      organizationId = orgByOwner.id;
    } else {
      const member = await prisma.teamMember.findFirst({ where: { userId: session.user.id }, select: { organizationId: true } });
      if (member) organizationId = member.organizationId;
    }

    // If no organization exists, create a lightweight org record
    if (!organizationId) {
      const slug = `org-${Date.now()}-${Math.random().toString(36).slice(2,5)}`;
      const createdOrg = await prisma.organization.create({
        data: {
          name: `${user.email ?? "Customer"} Org`,
          slug,
          ownerId: session.user.id
        }
      });
      organizationId = createdOrg.id;
    }

    // Create or update subscription for this organization to represent FREE plan
    const verificationLimit = PLANS.FREE.maxVerifications;
    const existingSub = await prisma.subscription.findUnique({ where: { organizationId } });
    if (existingSub) {
      await prisma.subscription.update({ where: { organizationId }, data: { plan: "STARTER", status: SubscriptionStatus.ACTIVE, verificationLimit, verificationsUsed: 0 } as any });
    } else {
      await prisma.subscription.create({ data: { organizationId, plan: "STARTER", status: SubscriptionStatus.ACTIVE, verificationLimit, verificationsUsed: 0 } as any });
    }

    // Record onboarding metadata (monthly volume) in billing audit logs for later analysis
    if (typeof monthlyVolume === "number") {
      try {
        await prisma.billingAuditLog.create({
          data: {
            billingRecordId: (await prisma.billingRecord.findUnique({ where: { userId: session.user.id }, select: { id: true } }))?.id ?? "",
            eventType: "ONBOARDING",
            metadata: { monthlyVolume }
          }
        });
      } catch (err) {
        // non-fatal
        console.warn("Failed to record onboarding billing audit", err);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Onboarding completion failed:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    );
  }
}
