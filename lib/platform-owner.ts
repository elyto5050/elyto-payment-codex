import crypto from "node:crypto";
import type { PlatformOwnership as PlatformOwnershipRecord } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const PRIMARY_OWNER_FALLBACK_EMAIL = "avairalpandey@gmail.com";

export type TrustedPlatformOwnership = {
  ownerEmail: string;
  ownerUserId: string | null;
  isFallback: boolean;
  record?: PlatformOwnershipRecord;
};

function getOwnershipSecret() {
  return process.env.PLATFORM_OWNERSHIP_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "elyto-platform-owner";
}

function signOwnership(ownerEmail: string, ownerUserId?: string | null) {
  return crypto
    .createHmac("sha256", getOwnershipSecret())
    .update(`${ownerEmail}:${ownerUserId ?? ""}`)
    .digest("hex");
}

export function hashTransferToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashTransferCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function getConfiguredTransferCodeHash() {
  const raw = process.env.PLATFORM_OWNER_TRANSFER_CODE;
  if (raw) return hashTransferCode(raw);
  return process.env.PLATFORM_OWNER_TRANSFER_CODE_HASH ?? null;
}

export async function getTrustedPlatformOwnership(): Promise<TrustedPlatformOwnership> {
  const record = await prisma.platformOwnership.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (!record) {
    return { ownerEmail: PRIMARY_OWNER_FALLBACK_EMAIL, ownerUserId: null, isFallback: true };
  }

  const trustedSignature = signOwnership(record.ownerEmail, record.ownerUserId);
  if (trustedSignature !== record.signature) {
    return { ownerEmail: PRIMARY_OWNER_FALLBACK_EMAIL, ownerUserId: null, isFallback: true };
  }

  return {
    ownerEmail: record.ownerEmail,
    ownerUserId: record.ownerUserId,
    isFallback: false,
    record
  };
}

export async function isPlatformOwnerUser(userId?: string | null, email?: string | null) {
  if (!userId && !email) return false;
  const ownership = await getTrustedPlatformOwnership();

  if (ownership.ownerUserId && userId && ownership.ownerUserId === userId) {
    return true;
  }

  return Boolean(email && ownership.ownerEmail.toLowerCase() === email.toLowerCase());
}

export async function ensurePlatformOwnershipRow() {
  const existing = await prisma.platformOwnership.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (existing) {
    return existing;
  }

  const ownerUser = await prisma.user.findUnique({
    where: { email: PRIMARY_OWNER_FALLBACK_EMAIL },
    select: { id: true, email: true }
  });

  const ownerEmail = ownerUser?.email ?? PRIMARY_OWNER_FALLBACK_EMAIL;
  const ownerUserId = ownerUser?.id ?? null;

  return prisma.platformOwnership.create({
    data: {
      ownerEmail,
      ownerUserId,
      signature: signOwnership(ownerEmail, ownerUserId)
    }
  });
}

export async function startOwnershipTransfer(targetEmail: string) {
  const ownership = await ensurePlatformOwnershipRow();
  const targetUser = await prisma.user.findUnique({
    where: { email: targetEmail.toLowerCase() },
    select: { id: true, email: true, name: true }
  });

  if (!targetUser) {
    throw new Error("Target user does not exist.");
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashTransferToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const record = await prisma.platformOwnership.update({
    where: { id: ownership.id },
    data: {
      transferRequestedForEmail: targetUser.email,
      transferRequestedForUserId: targetUser.id,
      transferTokenHash: tokenHash,
      transferExpiresAt: expiresAt,
      transferApprovedAt: null
    }
  });

  return { record, token, targetUser, expiresAt };
}

export async function getPendingOwnershipTransferByToken(token: string) {
  const ownership = await ensurePlatformOwnershipRow();
  const tokenHash = hashTransferToken(token);

  if (
    !ownership.transferTokenHash ||
    ownership.transferTokenHash !== tokenHash ||
    !ownership.transferRequestedForEmail ||
    !ownership.transferExpiresAt ||
    ownership.transferExpiresAt < new Date()
  ) {
    return null;
  }

  return ownership;
}

export async function finalizeOwnershipTransfer(token: string) {
  const ownership = await ensurePlatformOwnershipRow();
  const tokenHash = hashTransferToken(token);

  if (
    !ownership.transferTokenHash ||
    ownership.transferTokenHash !== tokenHash ||
    !ownership.transferRequestedForEmail ||
    !ownership.transferExpiresAt ||
    ownership.transferExpiresAt < new Date()
  ) {
    throw new Error("Transfer token is invalid or expired.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: ownership.transferRequestedForEmail },
    select: { id: true, email: true }
  });

  if (!targetUser) {
    throw new Error("Target user no longer exists.");
  }

  return prisma.platformOwnership.update({
    where: { id: ownership.id },
    data: {
      ownerEmail: targetUser.email,
      ownerUserId: targetUser.id,
      signature: signOwnership(targetUser.email, targetUser.id),
      transferApprovedAt: new Date(),
      transferRequestedForEmail: null,
      transferRequestedForUserId: null,
      transferTokenHash: null,
      transferExpiresAt: null
    }
  });
}
