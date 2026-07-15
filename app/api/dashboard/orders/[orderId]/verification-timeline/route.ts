import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { OrderStatus } from "@prisma/client";

/**
 * GET /api/dashboard/orders/[orderId]/verification-timeline
 * Fetch verification timeline events for an order
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await requireSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { publicId: orderId },
      include: {
        project: {
          include: { organization: true }
        },
        verifiedTransaction: true,
        product: { select: { name: true } }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check authorization
    const org = order.project.organization;
    const userOrg = await prisma.organization.findFirst({
      where: {
        id: org.id,
        members: { some: { userId: session.user.id } }
      }
    });

    if (!userOrg) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build verification timeline
    const timeline = [];

    // Event 1: Order created
    timeline.push({
      type: "ORDER_CREATED",
      timestamp: order.createdAt,
      title: "Order created",
      description: `${formatCurrency(Number(order.amount))} order initiated`,
      status: "completed"
    });

    // Event 2: UTR submitted (if applicable)
    if (order.submittedUtr) {
      timeline.push({
        type: "UTR_SUBMITTED",
        timestamp: order.updatedAt,
        title: "Payment reference submitted",
        description: `UTR: ${order.submittedUtr}`,
        status: "completed"
      });
    }

    // Event 3: Verification result
    if (order.status === OrderStatus.VERIFIED || order.status === OrderStatus.PAID) {
      timeline.push({
        type: "VERIFICATION_SUCCESS",
        timestamp: order.verifiedAt,
        title: "Payment verified",
        description: order.verifiedTransaction
          ? `Matched transaction: ${formatCurrency(Number(order.verifiedTransaction.amount))}`
          : "Payment verified",
        status: "completed"
      });
    } else if (order.status === OrderStatus.FAILED) {
      timeline.push({
        type: "VERIFICATION_FAILED",
        timestamp: order.failedAt,
        title: "Verification failed",
        description: order.failureReason ? getFailureReasonDescription(order.failureReason) : "Payment verification failed",
        status: "failed"
      });
    } else if (order.status === OrderStatus.PENDING) {
      timeline.push({
        type: "VERIFICATION_PENDING",
        timestamp: new Date(),
        title: "Awaiting payment",
        description: "Waiting for UTR submission and verification",
        status: "pending"
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          publicId: order.publicId,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          customerEmail: order.customerEmail,
          product: order.product?.name ?? "—"
        },
        timeline: timeline
          .filter((e) => e.timestamp !== null)
          .sort((a, b) => {
            const dateA = new Date(a.timestamp as Date).getTime();
            const dateB = new Date(b.timestamp as Date).getTime();
            return dateB - dateA;
          })
      }
    });
  } catch (error) {
    console.error("Verification timeline error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(Number(amount));
}

function getFailureReasonDescription(reason: string): string {
  const descriptions: Record<string, string> = {
    "EMAIL_NOT_FOUND": "Transaction not found in connected Gmail account",
    "UTR_ALREADY_USED": "This transaction reference has already been used",
    "AMOUNT_MISMATCH": "Transaction amount does not match order amount",
    "TIME_WINDOW_EXPIRED": "Payment window has expired",
    "INVALID_TRANSACTION": "Transaction appears suspicious or invalid",
    "DUPLICATE_SUBMISSION": "Duplicate transaction submission"
  };
  return descriptions[reason] ?? `Verification failed: ${reason}`;
}
