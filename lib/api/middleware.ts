import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashApiKey } from "@/lib/security/api-keys";
import { auth } from "@/lib/auth";
import { assertTenantAccess } from "@/lib/tenant";
import type { TeamRole } from "@prisma/client";
import type { PermissionKey } from "@/lib/rbac";

export async function authenticateApiKey(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const keyHash = hashApiKey(token);
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!apiKey || apiKey.revokedAt || apiKey.type !== "SECRET") return null;

  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return apiKey;
}

export async function requireSession(_request?: NextRequest | Request) {
  void _request;
  try {
    // Try auth() with no args (works in App Router route contexts)
    const session = await auth();
    if (session && session.user && session.user.id) {
      return session;
    }

    // If no session, return null
    return null;
  } catch (err) {
    console.error("[ERROR] requireSession threw:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function requireOrgAccess(userId: string, organizationId: string, minRoleOrPermission?: TeamRole | PermissionKey) {
  const membership = await assertTenantAccess(userId, organizationId);

  if (minRoleOrPermission) {
    if (minRoleOrPermission.includes(".")) {
      const permissions = membership.customRole?.permissions.map((entry) => entry.permission.key as PermissionKey) ?? [];
      const allowed = permissions.includes(minRoleOrPermission as PermissionKey);

      if (!allowed && membership.role !== "OWNER" && membership.role !== "ADMIN") {
        throw new Error("You do not have permission to perform this action.");
      }
    } else {
      const { assertPermission } = await import("@/lib/permissions");
      assertPermission(membership.role, minRoleOrPermission as TeamRole);
    }
  }
  return membership;
}

export function getClientIp(request: NextRequest | Request) {
  if ("headers" in request) {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  }
  return "local";
}
