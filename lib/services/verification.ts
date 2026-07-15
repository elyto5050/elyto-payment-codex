import { OrderStatus, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/services/audit";
import { incrementVerificationUsage } from "@/lib/services/billing";
import { incrementVerificationCount } from "@/lib/billing/service";
import { createNotification } from "@/lib/services/notifications";
import { sendPaymentFailedEmail, sendPaymentSuccessEmail } from "@/lib/email/send";
import { queues } from "@/lib/queues";
import { captureException } from "@/lib/monitoring";

export type VerificationFailureReason =
  | "EMAIL_NOT_FOUND"
  | "UTR_ALREADY_USED"
  | "AMOUNT_MISMATCH"
  | "INVALID_TRANSACTION"
  | "DUPLICATE_SUBMISSION";

function isVerifiedStatus(status: OrderStatus) {
  return status === OrderStatus.VERIFIED || status === OrderStatus.PAID;
}

export async function verifyOrderByUtr(orderPublicId: string) {
  const order = await prisma.order.findUnique({
    where: { publicId: orderPublicId },
    include: { project: { include: { organization: true } }, product: { select: { name: true } } }
  });

  if (!order || !order.submittedUtr) {
    return { verified: false, reason: "missing_order_or_utr" as const };
  }

  if (isVerifiedStatus(order.status)) {
    return { verified: true, reason: "already_verified" as const };
  }

  if (order.expiresAt && order.expiresAt < new Date()) {
    await failOrder(order, "TIME_WINDOW_EXPIRED");
    return { verified: false, reason: "TIME_WINDOW_EXPIRED" as const };
  }

  const existingVerifiedUtr = await prisma.verifiedTransaction.findUnique({
    where: {
      projectId_utr: {
        projectId: order.projectId,
        utr: order.submittedUtr
      }
    }
  });

  if (existingVerifiedUtr && existingVerifiedUtr.orderId !== order.id) {
    await failOrder(order, "UTR_ALREADY_USED");
    return { verified: false, reason: "UTR_ALREADY_USED" as const };
  }

  const duplicateSubmission = await prisma.order.findFirst({
    where: {
      submittedUtr: order.submittedUtr,
      status: { in: [OrderStatus.VERIFIED, OrderStatus.PAID] },
      NOT: { id: order.id }
    }
  });

  if (duplicateSubmission) {
    await failOrder(order, "UTR_ALREADY_USED");
    return { verified: false, reason: "UTR_ALREADY_USED" as const };
  }

  const transaction = await prisma.transaction.findUnique({
    where: {
      projectId_utr: {
        projectId: order.projectId,
        utr: order.submittedUtr
      }
    }
  });

  if (!transaction) {
    return { verified: false, reason: "EMAIL_NOT_FOUND" as const, retry: true };
  }

  if (transaction.status === TransactionStatus.USED || transaction.status === TransactionStatus.DUPLICATE) {
    await failOrder(order, "UTR_ALREADY_USED");
    return { verified: false, reason: "UTR_ALREADY_USED" as const };
  }

  if (transaction.status === TransactionStatus.SUSPICIOUS) {
    await failOrder(order, "INVALID_TRANSACTION");
    return { verified: false, reason: "INVALID_TRANSACTION" as const };
  }

  if (transaction.amount.toString() !== order.amount.toString()) {
    await failOrder(order, "AMOUNT_MISMATCH");
    return { verified: false, reason: "AMOUNT_MISMATCH" as const };
  }

  // Strict verification policy: verification occurs ONLY when
  // `transaction.amount == order.amount` AND `transaction.utr == order.submittedUtr`.
  // Do not apply fuzzy matching, time-window heuristics, or partial matches.

  const verifiedAt = new Date();
  const verificationSource = transaction.source ?? "gmail_fampay";

  const event = await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.USED, usedAt: verifiedAt }
    });

    await tx.verifiedTransaction.upsert({
      where: { orderId: order.id },
      create: {
        utr: order.submittedUtr!,
        amount: order.amount,
        timestamp: transaction.receivedAt,
        orderId: order.id,
        projectId: order.projectId,
        emailMessageId: transaction.emailMessageId,
        verificationSource
      },
      update: {}
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.VERIFIED,
        verifiedAt,
        verifiedTransactionId: transaction.id,
        matchedEmailId: transaction.emailMessageId,
        matchedUtr: order.submittedUtr,
        verificationSource,
        failureReason: null
      }
    });

    return tx.webhookEvent.create({
      data: {
        projectId: order.projectId,
        orderId: order.id,
        type: "order.verified",
        payload: {
          event: "order.verified",
          orderId: order.publicId,
          amount: Number(order.amount),
          utr: order.submittedUtr,
          status: "verified",
          verifiedAt: verifiedAt.toISOString(),
          matchedEmailId: transaction.emailMessageId,
          matchedReference: transaction.referenceNumber ?? null,
          sender: transaction.sender ?? null
        }
      }
    });
  });

  await writeAuditLog({
    organizationId: order.project.organizationId,
    action: "order.verified",
    targetType: "order",
    targetId: order.id,
    after: {
      status: "VERIFIED",
      utr: order.submittedUtr,
      matchedEmailId: transaction.emailMessageId,
      matchedReference: transaction.referenceNumber ?? null,
      sender: transaction.sender ?? null,
      verificationSource
    }
  });

  if (queues) {
    await queues.webhookDelivery.add("deliver", { eventId: event.id }, { attempts: 5, backoff: { type: "exponential", delay: 5000 } });
  }

  try {
    // update organization-level subscription usage (if enabled)
    await incrementVerificationUsage(order.project.organizationId);

    // mirror usage to owner's billing record so dashboard shows correct counts
    if (order.project?.organization?.ownerId) {
      try {
        await incrementVerificationCount(order.project.organization.ownerId);
      } catch (e) {
        // log but don't block main flow
        captureException(e, { orderId: order.publicId, context: "incrementVerificationCount" });
      }
    }

    await createNotification({
      organizationId: order.project.organizationId,
      type: "SUCCESS",
      title: "Payment verified",
      body: `Order ${order.publicId} verified for ₹${order.amount}`
    });
    if (order.customerEmail) {
      await sendPaymentSuccessEmail(order.customerEmail, order.publicId, `₹${order.amount}`);
    }
  } catch (err) {
    captureException(err, { orderId: order.publicId });
  }

  return { verified: true, reason: "verified" as const };
}

async function failOrder(
  order: {
    id: string;
    projectId: string;
    publicId: string;
    submittedUtr: string | null;
    customerEmail?: string | null;
    amount: { toString(): string };
    project: { organizationId: string };
  },
  reason: VerificationFailureReason
) {
  await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.FAILED, failedAt: new Date(), failureReason: reason }
  });

  const event = await prisma.webhookEvent.create({
    data: {
      projectId: order.projectId,
      orderId: order.id,
      type: "order.failed",
      payload: {
        event: "order.failed",
        orderId: order.publicId,
        reason,
        utr: order.submittedUtr
      }
    }
  });

  if (queues) {
    await queues.webhookDelivery.add("deliver", { eventId: event.id });
  }

  await writeAuditLog({
    organizationId: order.project.organizationId,
    action: "order.failed",
    targetType: "order",
    targetId: order.id,
    after: { reason }
  });

  try {
    await createNotification({
      organizationId: order.project.organizationId,
      type: "ERROR",
      title: "Payment verification failed",
      body: `Order ${order.publicId}: ${reason}`
    });
    if (order.customerEmail) {
      await sendPaymentFailedEmail(order.customerEmail, order.publicId, reason);
    }
  } catch (err) {
    captureException(err, { orderId: order.publicId });
  }
}
