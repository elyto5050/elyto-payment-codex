import { TeamRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const PERMISSION_CATALOG = [
  "users.read",
  "users.edit",
  "users.delete",
  "users.suspend",
  "users.restore",
  "users.sessions.read",
  "users.activity.read",
  "projects.read",
  "projects.create",
  "projects.edit",
  "projects.delete",
  "projects.archive",
  "products.read",
  "products.create",
  "products.edit",
  "products.delete",
  "orders.read",
  "orders.edit",
  "orders.refund",
  "orders.export",
  "analytics.read",
  "analytics.export",
  "gmail.read",
  "gmail.manage",
  "webhooks.read",
  "webhooks.manage",
  "webhooks.retry",
  "apikeys.read",
  "apikeys.create",
  "apikeys.revoke",
  "team.read",
  "team.invite",
  "team.remove",
  "roles.read",
  "roles.create",
  "roles.edit",
  "roles.delete",
  "billing.read",
  "billing.manage",
  "notifications.read",
  "support.read",
  "support.reply",
  "support.close",
  "security.read",
  "security.manage",
  "security.events.read",
  "activity.read",
  "activity.export",
  "platform.settings.read",
  "platform.settings.manage",
  "owner.transfer"
] as const;

export type PermissionKey = (typeof PERMISSION_CATALOG)[number];

const LEGACY_ROLE_PERMISSIONS: Record<TeamRole, PermissionKey[]> = {
  OWNER: [...PERMISSION_CATALOG],
  ADMIN: PERMISSION_CATALOG.filter((permission) => permission !== "owner.transfer"),
  MANAGER: [
    "projects.read",
    "projects.create",
    "projects.edit",
    "products.read",
    "products.create",
    "products.edit",
    "orders.read",
    "orders.edit",
    "orders.export",
    "analytics.read",
    "gmail.read",
    "gmail.manage",
    "webhooks.read",
    "webhooks.manage",
    "apikeys.read",
    "team.read",
    "support.read",
    "security.read",
    "activity.read",
    "billing.read"
  ],
  VIEWER: [
    "projects.read",
    "products.read",
    "orders.read",
    "analytics.read",
    "gmail.read",
    "webhooks.read",
    "apikeys.read",
    "team.read",
    "support.read",
    "security.read",
    "activity.read",
    "billing.read",
    "notifications.read"
  ]
};

export async function ensurePermissionCatalog() {
  for (const key of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key },
      create: {
        key,
        label: key.replaceAll(".", " ").replace(/\b\w/g, (v) => v.toUpperCase()),
        description: `Allows ${key.replaceAll(".", " ")}`
      },
      update: {}
    });
  }
}

export async function listOrganizationRoles(organizationId: string) {
  return prisma.customRole.findMany({
    where: { organizationId },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function createCustomRole(input: {
  organizationId: string;
  name: string;
  description?: string;
  permissionKeys: PermissionKey[];
}) {
  await ensurePermissionCatalog();

  return prisma.$transaction(async (tx) => {
    const role = await tx.customRole.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        description: input.description
      }
    });

    if (input.permissionKeys.length) {
      const permissions = await tx.permission.findMany({
        where: { key: { in: input.permissionKeys as string[] } },
        select: { id: true }
      });

      await tx.customRolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id
        }))
      });
    }

    return tx.customRole.findUniqueOrThrow({
      where: { id: role.id },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  });
}

export async function updateCustomRole(input: {
  roleId: string;
  organizationId: string;
  name?: string;
  description?: string | null;
  permissionKeys?: PermissionKey[];
}) {
  await ensurePermissionCatalog();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.customRole.findFirst({
      where: { id: input.roleId, organizationId: input.organizationId }
    });

    if (!existing) {
      throw new Error("Role not found.");
    }

    const role = await tx.customRole.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description
      }
    });

    if (input.permissionKeys) {
      await tx.customRolePermission.deleteMany({
        where: { roleId: role.id }
      });

      const permissions = await tx.permission.findMany({
        where: { key: { in: input.permissionKeys as string[] } },
        select: { id: true }
      });

      if (permissions.length) {
        await tx.customRolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id
          }))
        });
      }
    }

    return tx.customRole.findUniqueOrThrow({
      where: { id: role.id },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  });
}

export async function deleteCustomRole(roleId: string, organizationId: string) {
  const existing = await prisma.customRole.findFirst({
    where: { id: roleId, organizationId }
  });

  if (!existing) {
    throw new Error("Role not found.");
  }

  return prisma.customRole.delete({
    where: { id: existing.id }
  });
}

export async function getResolvedPermissionsForMember(
  member: Prisma.TeamMemberGetPayload<{
    include: {
      customRole: {
        include: {
          permissions: {
            include: {
              permission: true;
            };
          };
        };
      };
    };
  }>
) {
  if (member.customRole) {
    return member.customRole.permissions.map((permission) => permission.permission.key as PermissionKey);
  }

  return LEGACY_ROLE_PERMISSIONS[member.role];
}
