import { SubscriptionPlan, SubscriptionStatus, Subscription } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const PLAN_CONFIG: Record<SubscriptionPlan, { limit: number; label: string }> = {
  STARTER: { limit: 500, label: "Starter" },
  GROWTH: { limit: 5000, label: "Growth" },
  SCALE: { limit: 999999, label: "Scale" }
};

export async function getOrCreateSubscription(organizationId: string) {
  const existing = await prisma.subscription.findUnique({ where: { organizationId } });
  if (existing) return existing;

  return prisma.subscription.create({
    data: { organizationId, plan: SubscriptionPlan.STARTER, status: SubscriptionStatus.ACTIVE }
  });
}

export async function incrementVerificationUsage(organizationId: string) {
  const sub = await getOrCreateSubscription(organizationId);
  // Support unlimited subscriptions using -1 as sentinel
  if (sub.verificationLimit !== -1 && sub.verificationsUsed >= sub.verificationLimit) {
    throw new Error("Verification limit reached. Contact support to increase your limit.");
  }
  return prisma.subscription.update({
    where: { organizationId },
    data: { verificationsUsed: { increment: 1 } }
  });
}

/**
 * Reset verificationsUsed for a single subscription (used on successful renewal)
 */
export async function resetSubscriptionUsage(subscriptionId: string) {
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: { verificationsUsed: 0 }
  });
}

/**
 * Scan for subscriptions whose `currentPeriodEnd` has passed and reset their
 * `verificationsUsed` counters, advancing the period by 30 days.
 * This should be invoked by a scheduled worker (cron) in production.
 */
export async function resetDueSubscriptionsUsage() {
  const now = new Date();
  const due = await prisma.subscription.findMany({ where: { currentPeriodEnd: { lte: now } } });

  if (!due?.length) return { updated: 0 };

  const updates: Promise<Subscription>[] = [];
  for (const s of due) {
    const nextPeriodEnd = s.currentPeriodEnd ? new Date(s.currentPeriodEnd) : new Date();
    // advance by ~30 days
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 30);
    updates.push(
      prisma.subscription.update({
        where: { id: s.id },
        data: { verificationsUsed: 0, currentPeriodEnd: nextPeriodEnd }
      })
    );
  }

  await Promise.all(updates);
  return { updated: updates.length };
}
