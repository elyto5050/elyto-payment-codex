import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { TransactionStatus, OrderStatus } from "@prisma/client";
import { queues } from "@/lib/queues";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_allowed_in_production" }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { projectId, utr, amount } = (body as { projectId?: string; utr?: string; amount?: number }) ?? {};
  if (!projectId || !utr || typeof amount !== "number") {
    return NextResponse.json({ error: "missing_or_invalid_fields" }, { status: 400 });
  }

  try {
    const transaction = await prisma.transaction.create({
      data: {
        projectId,
        utr,
        amount,
        source: "gmail_fampay",
        status: TransactionStatus.UNMATCHED,
        receivedAt: new Date()
      }
    });

    // If a pending order exists for this project with the same UTR, enqueue
    // a payment-verification job (mirrors the behavior in lib/gmail/sync.ts).
    if (queues) {
      const pendingOrder = await prisma.order.findFirst({
        where: {
          projectId,
          submittedUtr: utr,
          status: { in: [OrderStatus.UTR_SUBMITTED, OrderStatus.VERIFYING] }
        }
      });

      if (pendingOrder) {
          if (queues) {
            try {
              await queues.paymentVerification.add("verify-order", { orderPublicId: pendingOrder.publicId });
            } catch (err) {
              logger.warn("Failed to enqueue payment-verification (debug route); falling back to local verification", { error: err instanceof Error ? err.message : String(err), orderPublicId: pendingOrder.publicId });
              try {
                const { verifyOrderByUtr } = await import("@/lib/services/verification");
                await verifyOrderByUtr(pendingOrder.publicId);
              } catch (err2) {
                logger.warn("Local verification fallback failed (debug route)", { error: err2 instanceof Error ? err2.message : String(err2), orderPublicId: pendingOrder.publicId });
              }
            }
          } else {
            try {
              const { verifyOrderByUtr } = await import("@/lib/services/verification");
              await verifyOrderByUtr(pendingOrder.publicId);
            } catch (err) {
              logger.warn("Local verification fallback failed (debug route, no queues)", { error: err instanceof Error ? err.message : String(err), orderPublicId: pendingOrder.publicId });
            }
          }
        }
    }

    return NextResponse.json(transaction);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
