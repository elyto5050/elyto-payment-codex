import { TeamRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils";
import { cacheGet, cacheSet } from "@/lib/server-cache";

export async function bootstrapOrganization(userId: string, name?: string | null, email?: string | null) {
  console.log(`[ORG][${new Date().toISOString()}] bootstrapOrganization start for userId: ${userId}`);
  const existing = await prisma.teamMember.findFirst({
    where: { userId },
    include: { organization: true }
  });

  if (existing) {
    console.log(`[ORG][${new Date().toISOString()}] bootstrapOrganization - existing organization found: ${existing.organization?.id}`);
    return existing.organization;
  }

  const baseName = name?.trim() || email?.split("@")[0] || "workspace";
  let slug = slugify(baseName);
  let suffix = 0;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(baseName)}-${suffix}`;
  }

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: `${baseName}'s workspace`,
        slug,
        ownerId: userId
      }
    });

    await tx.teamMember.create({
      data: {
        organizationId: organization.id,
        userId,
        role: TeamRole.OWNER
      }
    });

    // Do not auto-create a paid subscription here. New users receive a FREE billing record
    // via `initializeBillingRecord` called during user creation.

    console.log(`[ORG][${new Date().toISOString()}] bootstrapOrganization - created organization: ${organization.id}`);
    return organization;
  });
}

export async function getUserOrganization(userId: string) {
  const cacheKey = `userOrg:${userId}`;
  const cached = cacheGet<any>(cacheKey);
  if (cached) return cached;

  const membership = await prisma.teamMember.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" }
  });
  const org = membership?.organization ?? null;
  try { if (org) cacheSet(cacheKey, org); } catch (_) {}
  console.log(`[ORG][${new Date().toISOString()}] getUserOrganization lookup for userId: ${userId} -> ${org?.id ?? "none"}`);
  return org;
}
