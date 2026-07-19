/**
 * Self-Billing Infrastructure (Elyto-in-Elyto)
 * 
 * The platform uses its own payment verification system to handle subscriptions
 * Transaction Flow:
 * 1. User initiates subscription purchase
 * 2. System creates payment verification request to UPI: aviralji@fam
 * 3. Gmail webhook detects incoming payment
 * 4. Verification confirms successful transaction
 * 5. Webhook handler triggers entitlement provisioning
 * 6. User's plan is upgraded, verification limits unlocked
 * 7. Notification sent to user's account (avairalpandey@gmail.com dashboard)
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma, SubscriptionPlan, SubscriptionStatus, NotificationType } from "@prisma/client";
import { PLANS } from "@/lib/plans";
import { upgradePlan } from "./service";
import type { BillingPlan } from "./service";
import { createNotification } from "@/lib/services/notifications";
import { cacheDel, cacheGet, cacheSet } from "@/lib/server-cache";

export const SELF_BILLING_CONFIG = {
  // Corporate treasury account
  UPI_DESTINATION: "aviralji@fam",
  
  // Admin account to receive subscription confirmations
  ADMIN_EMAIL: "avairalpandey@gmail.com",
  
  // Payment reference prefix for tracking
  PAYMENT_REF_PREFIX: "SUB_",
  
  // Webhook timeout (30 minutes)
  PAYMENT_WINDOW_MS: 30 * 60 * 1000,
} as const;

/**
 * Create subscription payment request
 * This generates a payment verification flow through Elyto's own system
 */
export async function createSubscriptionPayment(
  userId: string,
  userEmail: string,
  planTier: BillingPlan,
  planPrice: number
) {
  try {
    // Generate unique payment reference
    const paymentRef = `${SELF_BILLING_CONFIG.PAYMENT_REF_PREFIX}${userId}_${Date.now()}`;

    // Create payment record
    const payment = await prisma.subscriptionPayment.create({
      data: {
        userId,
        userEmail,
        planTier,
        amount: planPrice,
        paymentRef,
        status: "PENDING",
        targetUPI: SELF_BILLING_CONFIG.UPI_DESTINATION,
        expiresAt: new Date(Date.now() + SELF_BILLING_CONFIG.PAYMENT_WINDOW_MS),
      },
    });

    return {
      paymentId: payment.id,
      paymentRef: paymentRef,
      targetUPI: SELF_BILLING_CONFIG.UPI_DESTINATION,
      amount: planPrice,
      currency: "INR",
      userEmail: userEmail,
      planTier: planTier,
      expiresAt: payment.expiresAt,
      // In production, this would be sent to payment UI
      paymentInitialized: true,
    };
  } catch (error) {
    console.error(`Failed to create subscription payment for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Webhook handler for subscription payment verification
 * Called by the Gmail webhook when payment is detected
 * 
 * This is the core of Elyto-in-Elyto: using own verification to confirm subscription
 */
export async function verifySubscriptionPaymentByUtr(params: {
  paymentId?: string;
  paymentRef?: string;
  submittedUtr?: string;
}) {
  const { paymentId, paymentRef, submittedUtr } = params;

  if (!paymentId && !paymentRef) {
    return { verified: false, reason: "missing_payment_identifier", retry: false } as const;
  }

  if (!submittedUtr) {
    return { verified: false, reason: "missing_submitted_utr", retry: false } as const;
  }

  const payment = paymentId
    ? await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } })
    : null;

  const subscriptionPayment = payment ?? (paymentRef ? await prisma.subscriptionPayment.findUnique({ where: { paymentRef } }) : null);

  if (!subscriptionPayment) {
    return { verified: false, reason: "payment_not_found", retry: false } as const;
  }

  if (subscriptionPayment.status !== "PENDING") {
    return { verified: true, reason: "already_verified" } as const;
  }

  if (subscriptionPayment.expiresAt && subscriptionPayment.expiresAt < new Date()) {
    return { verified: false, reason: "expired", retry: false } as const;
  }

  const tx = await prisma.transaction.findFirst({
    where: { utr: submittedUtr, amount: subscriptionPayment.amount },
    orderBy: { receivedAt: "desc" }
  });

  if (!tx) {
    return { verified: false, reason: "EMAIL_NOT_FOUND", retry: true } as const;
  }

  const result = await handleSubscriptionPaymentWebhook({
    from: tx.sender ?? subscriptionPayment.userEmail,
    to: SELF_BILLING_CONFIG.UPI_DESTINATION,
    amount: Number(tx.amount),
    transactionHash: tx.emailMessageId ?? tx.id,
    paymentRef: subscriptionPayment.paymentRef,
    timestamp: tx.receivedAt.toISOString()
  } as any);

  if (result?.success) {
    return { verified: true, reason: "verified" } as const;
  }

  return { verified: false, reason: result?.reason ?? "verification_failed", retry: false } as const;
}

export async function handleSubscriptionPaymentWebhook(webhookData: {
  from: string;
  to: string;
  amount: number;
  transactionHash: string;
  paymentRef: string;
  timestamp: string;
}) {
  try {
    // Validate webhook data
    if (webhookData.to !== SELF_BILLING_CONFIG.UPI_DESTINATION) {
      console.warn("Payment received to wrong UPI:", webhookData.to);
      return { success: false, reason: "Invalid UPI destination" };
    }

    // Find matching subscription payment
    const subscriptionPayment = await prisma.subscriptionPayment.findFirst({
      where: {
        paymentRef: webhookData.paymentRef,
        status: "PENDING",
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
    });

    if (!subscriptionPayment) {
      console.warn("No matching subscription payment found for ref:", webhookData.paymentRef);
      return { success: false, reason: "Payment reference not found" };
    }

    // Verify amount matches (coerce Prisma Decimal to number)
    if (Number(subscriptionPayment.amount) !== webhookData.amount) {
      console.warn("Payment amount mismatch:", {
        expected: subscriptionPayment.amount,
        received: webhookData.amount,
      });
      return { success: false, reason: "Amount mismatch" };
    }

    // Mark payment as verified atomically to avoid duplicate processing.
    const updateResult = await prisma.subscriptionPayment.updateMany({
      where: { id: subscriptionPayment.id, status: "PENDING" },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        transactionHash: webhookData.transactionHash,
      },
    });

    if (updateResult.count === 0) {
      return { success: true, reason: "already_verified" };
    }

    const verifiedPayment = await prisma.subscriptionPayment.findUnique({ where: { id: subscriptionPayment.id } });
    if (!verifiedPayment) {
      return { success: false, reason: "verification_failed" };
    }

    // ========================================
    // ENTITLEMENT PROVISIONING
    // This is where the subscription actually gets activated
    // ========================================

    // Upgrade user's billing plan
    const updatedBilling = await upgradePlan(
      subscriptionPayment.userId,
      subscriptionPayment.planTier as BillingPlan
    );

    // Determine organization to attach subscription to
    let organizationId: string | null = null;
    const orgByOwner = await prisma.organization.findFirst({ where: { ownerId: subscriptionPayment.userId } });
    if (orgByOwner) {
      organizationId = orgByOwner.id;
    } else {
      const member = await prisma.teamMember.findFirst({ where: { userId: subscriptionPayment.userId }, select: { organizationId: true } });
      if (member) organizationId = member.organizationId;
    }

    // If no organization exists for this user, create a lightweight org record
    if (!organizationId) {
      const slug = `org-${Date.now()}-${Math.random().toString(36).slice(2,5)}`;
      const createdOrg = await prisma.organization.create({
        data: {
          name: `${subscriptionPayment.userEmail ?? "Customer"} Org`,
          slug,
          ownerId: subscriptionPayment.userId,
        },
      });
      organizationId = createdOrg.id;
    }

    // Create subscription record using schema-aligned fields
    const planKey = subscriptionPayment.planTier as unknown as SubscriptionPlan;
    // Use centralized PLANS mapping for limits
    const verificationLimit = (PLANS as any)[subscriptionPayment.planTier as string]?.maxVerifications ?? 500;

    const subscription = await prisma.subscription.create({
      data: {
        organizationId,
        plan: planKey,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        verificationLimit: verificationLimit,
        verificationsUsed: 0,
      },
    });

    // Invalidate subscription/billing caches for this user
    try {
      cacheDel(`subscription:${subscriptionPayment.userId}`);
      cacheDel(`billing:${subscriptionPayment.userId}`);
    } catch (_) {}

    // Send notification to user's dashboard
    await sendSubscriptionNotification(organizationId, subscriptionPayment.userId, subscriptionPayment.planTier as BillingPlan);

    // Notify purchaser via email
    try {
      const planNames = {
        FREE: (PLANS as any).FREE?.name,
        PREMIUM_1: (PLANS as any).PREMIUM_1?.name,
        PREMIUM_2: (PLANS as any).PREMIUM_2?.name,
        PREMIUM_3: (PLANS as any).PREMIUM_3?.name,
        ENTERPRISE: (PLANS as any).ENTERPRISE?.name,
      } as Record<string, string>;
      const limits = `${verificationLimit === -1 ? "Unlimited" : verificationLimit} verifications`;
      const renewalDate = subscription.currentPeriodEnd?.toISOString() ?? null;
      const purchaserEmail = subscriptionPayment.userEmail ?? "";
      // Lazy import to avoid circular deps
      const { sendSubscriptionActivatedEmail } = await import("@/lib/email/send");
      if (purchaserEmail) await sendSubscriptionActivatedEmail(purchaserEmail, planNames[subscriptionPayment.planTier as BillingPlan], limits, renewalDate);
    } catch (err) {
      console.warn("Failed to send subscription activation email", err);
    }

    // Log event (serialize Decimal to primitive)
    await logSubscriptionEvent(subscriptionPayment.userId, "SUBSCRIPTION_ACTIVATED", {
      plan: subscriptionPayment.planTier,
      amount: Number(subscriptionPayment.amount),
      paymentId: subscriptionPayment.id,
      transactionHash: webhookData.transactionHash,
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      plan: subscriptionPayment.planTier,
      userId: subscriptionPayment.userId,
      verificationQuotaUnlocked: true,
    };
  } catch (error) {
    console.error("Failed to process subscription payment webhook:", error);
    return { success: false, reason: "Processing failed" };
  }
}

/**
 * Send subscription notification to user
 */
async function sendSubscriptionNotification(organizationId: string, userId: string, planTier: BillingPlan) {
  try {
    // Create dashboard notification
    const planNames = {
      FREE: (PLANS as any).FREE?.name,
      PREMIUM_1: (PLANS as any).PREMIUM_1?.name,
      PREMIUM_2: (PLANS as any).PREMIUM_2?.name,
      PREMIUM_3: (PLANS as any).PREMIUM_3?.name,
      ENTERPRISE: (PLANS as any).ENTERPRISE?.name,
    } as Record<string, string>;
    await createNotification({
      organizationId,
      userId,
      type: NotificationType.SUCCESS,
      title: `Subscription Upgraded: ${planNames[planTier]}`,
      body: `Your subscription has been successfully upgraded to ${planNames[planTier]}. Your verification quota is now unlocked!`,
    });
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}:`, error);
  }
}

/**
 * Get active subscription for user
 */
export async function getUserSubscription(userId: string) {
  try {
    const cacheKey = `subscription:${userId}`;
    const cached = cacheGet<any>(cacheKey);
    if (cached) return cached;
    // Find organization for this user (owner or member)
    let organizationId: string | null = null;
    const orgByOwner = await prisma.organization.findFirst({ where: { ownerId: userId }, select: { id: true } });
    if (orgByOwner) organizationId = orgByOwner.id;
    else {
      const member = await prisma.teamMember.findFirst({ where: { userId }, select: { organizationId: true } });
      if (member) organizationId = member.organizationId;
    }

    if (!organizationId) return null;

    const subscription = await prisma.subscription.findUnique({ where: { organizationId } });
    try { cacheSet(cacheKey, subscription); } catch (_) {}
    return subscription;
  } catch (error) {
    console.error(`Failed to get subscription for user ${userId}:`, error);
    return null;
  }
}

/**
 * Check if subscription is still valid
 */
export async function isSubscriptionValid(userId: string): Promise<boolean> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) return false;
    if (subscription.status !== SubscriptionStatus.ACTIVE) return false;
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd <= new Date()) return false;
    return true;
  } catch (error) {
    console.error(`Failed to check subscription validity for user ${userId}:`, error);
    return false;
  }
}

/**
 * Handle subscription renewal (monthly)
 * Called by a background job
 */
export async function processSubscriptionRenewal(subscriptionId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId }, select: { organizationId: true, plan: true } });
    if (!subscription) return { success: false, reason: "Subscription not found" };

    // Find organization owner to charge
    const org = await prisma.organization.findUnique({ where: { id: subscription.organizationId }, select: { ownerId: true } });
    if (!org) return { success: false, reason: "Organization not found" };

    const owner = await prisma.user.findUnique({ where: { id: org.ownerId }, select: { id: true, email: true } });
    if (!owner) return { success: false, reason: "Owner not found" };

    // Map Prisma SubscriptionPlan -> application BillingPlan
    function mapSubscriptionToBillingPlan(plan: SubscriptionPlan): BillingPlan {
      switch (plan) {
        case SubscriptionPlan.STARTER:
          // STARTER should map to FREE (previously mapped to PREMIUM_2 erroneously)
          return "FREE";
        case SubscriptionPlan.GROWTH:
          return "PREMIUM_3"; // Growth maps to higher paid tier
        case SubscriptionPlan.SCALE:
          return "ENTERPRISE"; // Scale maps to enterprise
        default:
          return "FREE";
      }
    }

    const billingPlan = mapSubscriptionToBillingPlan(subscription.plan as SubscriptionPlan);
    const amount = getPlanPrice(billingPlan);

    // Create a renewal payment request (re-uses existing helper)
    const paymentRequest = await createSubscriptionPayment(owner.id, owner.email ?? "", billingPlan, amount);

    // Log renewal attempt
    await logSubscriptionEvent(owner.id, "RENEWAL_INITIATED", {
      subscriptionId,
      organizationId: subscription.organizationId,
      billingPlan,
      amount,
      paymentRef: paymentRequest.paymentRef,
    });

    return { success: true, payment: paymentRequest };
  } catch (error) {
    console.error("Failed to process subscription renewal:", error);
    return { success: false, reason: "Renewal processing failed" };
  }
}

/**
 * Get plan price
 */
function getPlanPrice(plan: BillingPlan): number {
  // Read canonical price from PLANS
  return (PLANS as any)[plan]?.price ?? 0;
}

/**
 * Cancel active subscription
 */
export async function cancelActiveSubscription(userId: string, reason: string) {
  try {
    // Locate the organization for this user
    let organizationId: string | null = null;
    const orgByOwner = await prisma.organization.findFirst({ where: { ownerId: userId }, select: { id: true } });
    if (orgByOwner) organizationId = orgByOwner.id;
    else {
      const member = await prisma.teamMember.findFirst({ where: { userId }, select: { organizationId: true } });
      if (member) organizationId = member.organizationId;
    }

    if (!organizationId) {
      return { success: false, reason: "No organization found for user" };
    }

    const subscription = await prisma.subscription.findUnique({ where: { organizationId } });

    if (!subscription) {
      return { success: false, reason: "No active subscription found" };
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
      },
    });

    // Downgrade user to free plan
    await prisma.billingRecord.update({
      where: { userId },
      data: {
        currentPlan: "FREE",
        verificationCount: 0, // Reset quota on cancellation
      },
    });

    // Log event
    await logSubscriptionEvent(userId, "SUBSCRIPTION_CANCELLED", { reason });

    return { success: true, subscriptionId: subscription.id };
  } catch (error) {
    console.error(`Failed to cancel subscription for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Log subscription event for audit trail
 */
async function logSubscriptionEvent(userId: string, eventType: string, metadata: Prisma.JsonValue) {
  try {
    await prisma.subscriptionAuditLog.create({
      data: {
        userId,
        eventType,
        metadata: metadata as Prisma.InputJsonValue,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Failed to log subscription event:`, error);
  }
}

/**
 * Get subscription payment history for user
 */
export async function getSubscriptionPaymentHistory(userId: string) {
  try {
    const payments = await prisma.subscriptionPayment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return payments;
  } catch (error) {
    console.error(`Failed to get payment history for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get all pending payments (admin)
 */
export async function getPendingSubscriptionPayments() {
  try {
    const payments = await prisma.subscriptionPayment.findMany({
      where: {
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return payments;
  } catch (error) {
    console.error("Failed to get pending payments:", error);
    return [];
  }
}

/**
 * Manually verify subscription payment (admin only, for edge cases)
 */
export async function manuallyVerifySubscriptionPayment(
  paymentId: string,
  transactionHash: string,
  verifierId: string
) {
  try {
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Process as if webhook came through
    const result = await handleSubscriptionPaymentWebhook({
      from: payment.userEmail,
      to: SELF_BILLING_CONFIG.UPI_DESTINATION,
      amount: Number(payment.amount),
      transactionHash,
      paymentRef: payment.paymentRef,
      timestamp: new Date().toISOString(),
    });

    // Log manual verification in subscription audit log
    await logSubscriptionEvent(verifierId, "MANUAL_SUBSCRIPTION_VERIFICATION", {
      paymentId,
      transactionHash,
    });

    return result;
  } catch (error) {
    console.error("Failed to manually verify subscription payment:", error);
    throw error;
  }
}
