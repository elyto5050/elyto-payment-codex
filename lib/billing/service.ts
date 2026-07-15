/**
 * Billing System - Quota management, verification counters, plan enforcement
 * 
 * Core Rules:
 * - Verification counters track SUCCESSFUL payments only
 * - Failed, cancelled, duplicate, rejected payments do NOT consume quota
 * - Counters are cumulative per subscription tier (no monthly reset)
 * - Plan limits are enforced at verification time
 * - Quota reset only happens on plan downgrade/upgrade
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { cacheGet, cacheSet, cacheDel } from "@/lib/server-cache";
import { PLANS, PlanKey } from "@/lib/plans";

export const BILLING_PLANS = PLANS as const;

export type BillingPlan = PlanKey;

/**
 * Initialize billing record for new user (on signup)
 */
export async function initializeBillingRecord(userId: string, email: string) {
  try {
    const existing = await prisma.billingRecord.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const billing = await prisma.billingRecord.create({
      data: {
        userId,
        email,
        currentPlan: "FREE",
        verificationCount: 0,
        projectCount: 0,
        isActive: true,
      },
    });

    // seed cache for immediate reads
    try {
      cacheSet(`billing:${userId}`, {
        userId: billing.userId,
        currentPlan: billing.currentPlan,
        verificationCount: billing.verificationCount,
        projectCount: billing.projectCount,
        isActive: billing.isActive,
      });
    } catch (e) {
      // non-fatal
    }

    return billing;
  } catch (error) {
    console.error(`Failed to initialize billing for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Increment verification counter only on SUCCESSFUL verification
 * This is called by the verification webhook handler
 */
export async function incrementVerificationCount(userId: string): Promise<boolean> {
  try {
    const billing = await prisma.billingRecord.findUnique({
      where: { userId },
      select: {
        verificationCount: true,
        currentPlan: true,
        isActive: true,
      },
    });

    if (!billing || !billing.isActive) {
      return false;
    }

    const plan = BILLING_PLANS[billing.currentPlan as BillingPlan];
    const maxVerifications = plan.maxVerifications;

    // Check if user has reached quota (unless on enterprise)
    if (maxVerifications !== -1 && billing.verificationCount >= maxVerifications) {
      return false; // Quota exceeded, verification rejected
    }

    // Increment counter
    await prisma.billingRecord.update({
      where: { userId },
      data: {
        verificationCount: {
          increment: 1,
        },
      },
    });

    // invalidate cache for this user
    try { cacheDel(`billing:${userId}`); } catch (_) {}

    return true;
  } catch (error) {
    console.error(`Failed to increment verification count for user ${userId}:`, error);
    return false;
  }
}

/**
 * Check if user can perform verification based on plan quota
 */
export async function canVerifyPayment(userId: string): Promise<boolean> {
  try {
    const cacheKey = `billing:${userId}`;
    const cached = cacheGet<any>(cacheKey);
    let billing = cached;
    if (!billing) {
      billing = await prisma.billingRecord.findUnique({
        where: { userId },
        select: {
          verificationCount: true,
          currentPlan: true,
          isActive: true,
        },
      });
      if (billing) cacheSet(cacheKey, billing);
    }

    if (!billing || !billing.isActive) {
      return false;
    }

    const plan = BILLING_PLANS[billing.currentPlan as BillingPlan];

    // Enterprise unlimited access
    if (plan.maxVerifications === -1) {
      return true;
    }

    // Check if user has quota remaining
    return billing.verificationCount < plan.maxVerifications;
  } catch (error) {
    console.error(`Failed to check verification eligibility for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get remaining verifications for user
 */
export async function getRemainingVerifications(userId: string): Promise<number | null> {
  try {
    const cacheKey = `billing:${userId}`;
    let billing = cacheGet<any>(cacheKey);
    if (!billing) {
      billing = await prisma.billingRecord.findUnique({
        where: { userId },
        select: {
          verificationCount: true,
          currentPlan: true,
        },
      });
      if (billing) cacheSet(cacheKey, billing);
    }

    if (!billing) {
      return null;
    }

    const plan = BILLING_PLANS[billing.currentPlan as BillingPlan];

    // Unlimited
    if (plan.maxVerifications === -1) {
      return -1;
    }

    return plan.maxVerifications - billing.verificationCount;
  } catch (error) {
    console.error(`Failed to get remaining verifications for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get billing information for user
 */
export async function getBillingInfo(userId: string) {
  try {
    const cacheKey = `billing:${userId}`;
    const cached = cacheGet<any>(cacheKey);
    if (cached) {
      return cached;
    }
    const billing = await prisma.billingRecord.findUnique({
      where: { userId },
      select: {
        userId: true,
        currentPlan: true,
        verificationCount: true,
        projectCount: true,
        isActive: true,
        lastIncrementedAt: true,
        planUpgradedAt: true,
      },
    });

    if (!billing) {
      return null;
    }

    const plan = BILLING_PLANS[billing.currentPlan as BillingPlan];

    const result = {
      ...billing,
      planName: plan.name,
      planPrice: plan.price,
      maxVerifications: plan.maxVerifications,
      maxProjects: plan.maxProjects,
      remainingVerifications: plan.maxVerifications === -1 ? -1 : plan.maxVerifications - billing.verificationCount,
      usagePercentage:
        plan.maxVerifications === -1 ? 0 : Math.round((billing.verificationCount / plan.maxVerifications) * 100),
    };

    try { cacheSet(cacheKey, result); } catch (_) {}
    return result;
  } catch (error) {
    console.error(`Failed to get billing info for user ${userId}:`, error);
    return null;
  }
}

/**
 * Upgrade user to new plan
 */
export async function upgradePlan(userId: string, newPlan: BillingPlan) {
  try {
    const billing = await prisma.billingRecord.findUnique({
      where: { userId },
    });

    if (!billing) {
      throw new Error("Billing record not found");
    }

    // Validate plan exists
    if (!(newPlan in BILLING_PLANS)) {
      throw new Error(`Invalid plan: ${newPlan}`);
    }

    const plan = BILLING_PLANS[newPlan];

    const updated = await prisma.billingRecord.update({
      where: { userId },
      data: {
        currentPlan: newPlan,
        // Do NOT reset verification counter on upgrade
        // Only reset on downgrade with explicit flag
      },
    });

    // invalidate cache
    try { cacheDel(`billing:${userId}`); } catch (_) {}

    // Log upgrade event
    await logBillingEvent(userId, "UPGRADE", {
      fromPlan: billing.currentPlan,
      toPlan: newPlan,
      newPrice: plan.price,
    });

    return updated;
  } catch (error) {
    console.error(`Failed to upgrade plan for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Downgrade user to lower plan
 * Optionally reset verification counter
 */
export async function downgradePlan(userId: string, newPlan: BillingPlan, resetCounter: boolean = false) {
  try {
    const billing = await prisma.billingRecord.findUnique({
      where: { userId },
    });

    if (!billing) {
      throw new Error("Billing record not found");
    }

    const plan = BILLING_PLANS[newPlan];

    const updated = await prisma.billingRecord.update({
      where: { userId },
      data: {
        currentPlan: newPlan,
        ...(resetCounter && { verificationCount: 0 }),
      },
    });

    try { cacheDel(`billing:${userId}`); } catch (_) {}

    // Log downgrade event
    await logBillingEvent(userId, "DOWNGRADE", {
      fromPlan: billing.currentPlan,
      toPlan: newPlan,
      counterReset: resetCounter,
      newPrice: plan.price,
    });

    return updated;
  } catch (error) {
    console.error(`Failed to downgrade plan for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Manually adjust verification counter (admin only)
 */
export async function adjustVerificationCount(userId: string, adjustment: number, reason: string) {
  try {
    const billing = await prisma.billingRecord.findUnique({
      where: { userId },
    });

    if (!billing) {
      throw new Error("Billing record not found");
    }

    const newCount = Math.max(0, billing.verificationCount + adjustment);

    const updated = await prisma.billingRecord.update({
      where: { userId },
      data: {
        verificationCount: newCount,
      },
    });

    try { cacheDel(`billing:${userId}`); } catch (_) {}

    // Log adjustment
    await logBillingEvent(userId, "ADJUSTMENT", {
      adjustment,
      reason,
      previousCount: billing.verificationCount,
      newCount,
    });

    return updated;
  } catch (error) {
    console.error(`Failed to adjust verification count for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Log billing event for audit trail
 */
async function logBillingEvent(userId: string, eventType: string, metadata: Prisma.JsonValue) {
  try {
    // Resolve billing record id for this user
    const billing = await prisma.billingRecord.findUnique({ where: { userId }, select: { id: true } });
    if (!billing) {
      console.warn(`No billing record found for user ${userId} when logging event ${eventType}`);
      return;
    }

    await prisma.billingAuditLog.create({
      data: {
        billingRecordId: billing.id,
        eventType,
        metadata: metadata as Prisma.InputJsonValue,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Failed to log billing event:`, error);
  }
}

/**
 * Cancel subscription (mark as inactive)
 */
export async function cancelSubscription(userId: string, reason: string) {
  try {
    const updated = await prisma.billingRecord.update({
      where: { userId },
      data: {
        isActive: false,
        currentPlan: "FREE",
        verificationCount: 0,
      },
    });

    await logBillingEvent(userId, "CANCEL", { reason });
    try { cacheDel(`billing:${userId}`); } catch (_) {}
    return updated;
  } catch (error) {
    console.error(`Failed to cancel subscription for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get billing statistics (admin only)
 */
export async function getBillingStats() {
  try {
    const stats = await prisma.billingRecord.groupBy({
      by: ["currentPlan"],
      _count: {
        userId: true,
      },
      _sum: {
        verificationCount: true,
      },
    });

    return stats.map((stat) => ({
      plan: stat.currentPlan,
      userCount: stat._count.userId,
      totalVerifications: stat._sum.verificationCount || 0,
    }));
  } catch (error) {
    console.error("Failed to get billing stats:", error);
    throw error;
  }
}
