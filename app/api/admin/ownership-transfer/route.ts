import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requirePlatformOwner } from "@/lib/api/admin";
import { auth } from "@/lib/auth";
import { sendPlatformOwnerTransferEmail } from "@/lib/email/send";
import {
  finalizeOwnershipTransfer,
  getConfiguredTransferCodeHash,
  getPendingOwnershipTransferByToken,
  getTrustedPlatformOwnership,
  hashTransferCode,
  startOwnershipTransfer
} from "@/lib/platform-owner";
import { prisma } from "@/lib/db/prisma";

const startSchema = z.object({
  targetEmail: z.string().email(),
  transferCode: z.string().min(6)
});

const finishSchema = z.object({
  token: z.string().min(16)
});

export async function GET() {
  const owner = await requirePlatformOwner();
  if (!owner) return apiError("forbidden", "Owner access required.", 403);

  const ownership = await getTrustedPlatformOwnership();
  return apiOk({
    ownerEmail: ownership.ownerEmail,
    hasTransferCode: Boolean(getConfiguredTransferCodeHash()),
    pendingTransfer: ownership.record
      ? {
          targetEmail: ownership.record.transferRequestedForEmail,
          expiresAt: ownership.record.transferExpiresAt
        }
      : null
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body?.action as string | undefined;

  if (action === "start") {
    const owner = await requirePlatformOwner();
    if (!owner) return apiError("forbidden", "Owner access required.", 403);

    const parsed = startSchema.safeParse(body);
    if (!parsed.success) return apiError("invalid_request", "Invalid transfer request.", 422);

    const configuredHash = getConfiguredTransferCodeHash();
    if (!configuredHash) {
      return apiError("configuration_error", "Platform transfer code is not configured.", 500);
    }

    if (hashTransferCode(parsed.data.transferCode) !== configuredHash) {
      return apiError("forbidden", "Transfer code is invalid.", 403);
    }

    const { token, targetUser, expiresAt } = await startOwnershipTransfer(parsed.data.targetEmail);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verificationUrl = `${appUrl}/transferowner?token=${token}`;

    await sendPlatformOwnerTransferEmail({
      to: targetUser.email,
      currentOwnerEmail: owner.user.email,
      targetEmail: targetUser.email,
      verificationUrl,
      expiresAt
    });

    await prisma.securityEvent.create({
      data: {
        userId: owner.user.id,
        type: "platform.ownership_transfer_requested",
        severity: "CRITICAL",
        metadata: {
          targetEmail: targetUser.email,
          expiresAt: expiresAt.toISOString(),
          emailSent: Boolean(process.env.RESEND_API_KEY)
        }
      }
    });

    return apiOk({
      targetEmail: targetUser.email,
      expiresAt,
      emailSent: Boolean(process.env.RESEND_API_KEY)
    });
  }

  if (action === "finalize") {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return apiError("unauthorized", "Sign in as the transfer target to finalize ownership.", 401);
    }

    const parsed = finishSchema.safeParse(body);
    if (!parsed.success) return apiError("invalid_request", "Invalid finalize request.", 422);

    const pendingTransfer = await getPendingOwnershipTransferByToken(parsed.data.token);
    if (!pendingTransfer) {
      return apiError("forbidden", "Transfer token is invalid or expired.", 403);
    }

    if (pendingTransfer.transferRequestedForEmail?.toLowerCase() !== session.user.email.toLowerCase()) {
      return apiError("forbidden", "This transfer can only be finalized by the target owner.", 403);
    }

    const record = await finalizeOwnershipTransfer(parsed.data.token);
    return apiOk({
      ownerEmail: record.ownerEmail,
      updatedAt: record.updatedAt
    });
  }

  return apiError("invalid_request", "Unsupported transfer action.", 422);
}
