import { NextRequest } from "next/server";
import { PlatformRole } from "@prisma/client";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requirePlatformAdmin, requirePlatformOwner } from "@/lib/api/admin";
import { isPlatformOwnerUser, PRIMARY_OWNER_FALLBACK_EMAIL } from "@/lib/platform-owner";
import { prisma } from "@/lib/db/prisma";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    userId: z.string().min(1),
    name: z.string().max(120).nullable().optional(),
    platformRole: z.nativeEnum(PlatformRole).optional()
  }),
  z.object({ action: z.literal("suspend"), userId: z.string().min(1) }),
  z.object({ action: z.literal("restore"), userId: z.string().min(1) }),
  z.object({ action: z.literal("delete"), userId: z.string().min(1) })
]);

export async function GET(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return apiError("forbidden", "Platform access required.", 403);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "100");

  const total = await prisma.user.count();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    skip: (Math.max(1, page) - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      name: true,
      email: true,
      platformRole: true,
      createdAt: true,
      deactivatedAt: true,
      deletedAt: true,
      _count: {
        select: {
          sessions: true,
          teamMemberships: true,
          loginHistory: true,
          securityEvents: true
        }
      }
    }
  });

  const decorated = await Promise.all(
    users.map(async (user) => ({
      ...user,
      isProtectedOwner:
        user.email.toLowerCase() === PRIMARY_OWNER_FALLBACK_EMAIL ||
        (await isPlatformOwnerUser(user.id, user.email))
    }))
  );

  const meta = { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };

  return apiOk({ data: { users: decorated, platformRoles: Object.values(PlatformRole) }, meta });
}

export async function PATCH(request: NextRequest) {
  const owner = await requirePlatformOwner();
  if (!owner) return apiError("forbidden", "Owner access required.", 403);

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Invalid user action.", 422);

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true, name: true, platformRole: true }
  });

  if (!target) return apiError("not_found", "User not found.", 404);

  const isProtectedOwner =
    target.email.toLowerCase() === PRIMARY_OWNER_FALLBACK_EMAIL ||
    (await isPlatformOwnerUser(target.id, target.email));

  if (isProtectedOwner) {
    return apiError("protected_owner", "Protected owner accounts can only be changed through ownership transfer.", 403);
  }

  let data: {
    name?: string | null;
    platformRole?: PlatformRole;
    deactivatedAt?: Date | null;
    deletedAt?: Date | null;
  } = {};

  if (parsed.data.action === "update") {
    data = {
      name: parsed.data.name,
      platformRole: parsed.data.platformRole
    };
  }

  if (parsed.data.action === "suspend") {
    data = { deactivatedAt: new Date() };
  }

  if (parsed.data.action === "restore") {
    data = { deactivatedAt: null, deletedAt: null };
  }

  if (parsed.data.action === "delete") {
    data = { deletedAt: new Date(), deactivatedAt: new Date() };
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      platformRole: true,
      createdAt: true,
      deactivatedAt: true,
      deletedAt: true
    }
  });

  await prisma.securityEvent.create({
    data: {
      userId: target.id,
      type: `platform.user.${parsed.data.action}`,
      severity: parsed.data.action === "update" ? "INFO" : "CRITICAL",
      metadata: {
        actorUserId: owner.user.id,
        actorEmail: owner.user.email
      }
    }
  });

  return apiOk({ user });
}
