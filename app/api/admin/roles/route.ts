import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requirePlatformOwner } from "@/lib/api/admin";
import { createCustomRole, deleteCustomRole, listOrganizationRoles, PERMISSION_CATALOG, updateCustomRole } from "@/lib/rbac";
import { prisma } from "@/lib/db/prisma";

const roleSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2).max(60),
  description: z.string().max(240).optional(),
  permissionKeys: z.array(z.enum(PERMISSION_CATALOG)).min(1)
});

const patchSchema = z.object({
  roleId: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(240).nullable().optional(),
  permissionKeys: z.array(z.enum(PERMISSION_CATALOG)).optional()
});

export async function GET(request: NextRequest) {
  const owner = await requirePlatformOwner();
  if (!owner) return apiError("forbidden", "Owner access required.", 403);

  const organizationId = new URL(request.url).searchParams.get("organizationId");

  if (!organizationId) {
    const organizations = await prisma.organization.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true, ownerId: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return apiOk({ organizations, permissionCatalog: PERMISSION_CATALOG });
  }

  const roles = await listOrganizationRoles(organizationId);
  return apiOk({ roles, permissionCatalog: PERMISSION_CATALOG });
}

export async function POST(request: NextRequest) {
  const owner = await requirePlatformOwner();
  if (!owner) return apiError("forbidden", "Owner access required.", 403);

  const parsed = roleSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Invalid role payload.", 422);

  const role = await createCustomRole(parsed.data);
  return apiOk(role, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const owner = await requirePlatformOwner();
  if (!owner) return apiError("forbidden", "Owner access required.", 403);

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Invalid role payload.", 422);

  const role = await updateCustomRole(parsed.data);
  return apiOk(role);
}

export async function DELETE(request: NextRequest) {
  const owner = await requirePlatformOwner();
  if (!owner) return apiError("forbidden", "Owner access required.", 403);

  const roleId = new URL(request.url).searchParams.get("roleId");
  const organizationId = new URL(request.url).searchParams.get("organizationId");

  if (!roleId || !organizationId) {
    return apiError("invalid_request", "roleId and organizationId are required.", 422);
  }

  await deleteCustomRole(roleId, organizationId);
  return apiOk({ success: true });
}
