import crypto from "node:crypto";
import { TeamRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashWithPepper } from "@/lib/security/crypto";

export async function listTeamMembers(organizationId: string) {
  return prisma.teamMember.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" }
  });
}

export async function listPendingInvites(organizationId: string) {
  return prisma.teamInvite.findMany({
    where: { organizationId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" }
  });
}

export async function createTeamInvite(input: {
  organizationId: string;
  email: string;
  role: TeamRole;
  invitedById: string;
}) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashWithPepper(token);

  const invite = await prisma.teamInvite.upsert({
    where: { organizationId_email: { organizationId: input.organizationId, email: input.email.toLowerCase() } },
    create: {
      organizationId: input.organizationId,
      email: input.email.toLowerCase(),
      role: input.role,
      invitedById: input.invitedById,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    update: {
      role: input.role,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      acceptedAt: null
    }
  });

  return { invite, token };
}

export async function acceptTeamInvite(token: string, userId: string, userEmail: string) {
  const tokenHash = hashWithPepper(token);
  const invite = await prisma.teamInvite.findFirst({
    where: { tokenHash, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }
  });

  if (!invite || invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error("Invalid or expired invite.");
  }

  await prisma.$transaction([
    prisma.teamMember.upsert({
      where: { organizationId_userId: { organizationId: invite.organizationId, userId } },
      create: { organizationId: invite.organizationId, userId, role: invite.role },
      update: { role: invite.role }
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() }
    })
  ]);

  return invite.organizationId;
}

export async function removeTeamMember(organizationId: string, userId: string) {
  const owner = await prisma.teamMember.findFirst({
    where: { organizationId, role: TeamRole.OWNER }
  });
  if (owner?.userId === userId) {
    throw new Error("Cannot remove the workspace owner.");
  }
  return prisma.teamMember.delete({
    where: { organizationId_userId: { organizationId, userId } }
  });
}
