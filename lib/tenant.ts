import { prisma } from "@/lib/db/prisma";

export async function getMembership(userId: string, organizationId: string) {
  return prisma.teamMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId
      }
    },
    include: {
      customRole: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });
}

export async function assertTenantAccess(userId: string, organizationId: string) {
  const membership = await getMembership(userId, organizationId);
  if (!membership) {
    throw new Error("Tenant access denied.");
  }

  return membership;
}
