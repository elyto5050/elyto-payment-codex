/**
 * RBAC Service - Check permissions, validate roles, manage access control
 */

import { prisma } from "@/lib/db/prisma";
import { RBACPermission, RBAC_PERMISSIONS, DEFAULT_ROLES, isValidPermission } from "./permissions";

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: string, permission: RBACPermission): Promise<boolean> {
  if (!isValidPermission(permission)) {
    return false;
  }

  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platformRole: true, id: true },
    });

    if (!user) {
      return false;
    }

    // Resolve platform role default permissions (OWNER/ADMIN/SUPPORT etc.)
    const platformPermissions = getPlatformRolePermissions(user.platformRole as string);

    // If user has no staff role record, fall back to platform role permissions

    const staffRole = await prisma.staffRole.findUnique({
      where: { userId },
      select: { customPermissions: true },
    });

    if (!staffRole) {
      return platformPermissions.includes(permission);
    }

    // Check custom permissions first, then fall back to platform permissions
    const permissions = (staffRole.customPermissions as string[]) || [];
    return permissions.includes(permission) || platformPermissions.includes(permission);
  } catch (error) {
    console.error(`Permission check failed for user ${userId}:`, error);
    return false;
  }
}

/**
 * Check multiple permissions (OR logic)
 */
export async function hasAnyPermission(userId: string, permissions: RBACPermission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(userId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check multiple permissions (AND logic)
 */
export async function hasAllPermissions(userId: string, permissions: RBACPermission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(userId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<RBACPermission[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platformRole: true },
    });

    if (!user) {
      return [];
    }

    // Admin gets all permissions
    if (user.platformRole === "ADMIN") {
      return Object.keys(RBAC_PERMISSIONS) as RBACPermission[];
    }

    // Get custom permissions
    const staffRole = await prisma.staffRole.findUnique({
      where: { userId },
      select: { customPermissions: true },
    });

    if (!staffRole) {
      // Return platform role default permissions
      return getPlatformRolePermissions(user.platformRole);
    }

    return (staffRole.customPermissions as string[]).filter(isValidPermission);
  } catch (error) {
    console.error(`Failed to get permissions for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get role permissions by name
 */
export function getRolePermissions(roleName: keyof typeof DEFAULT_ROLES): RBACPermission[] {
  const role = DEFAULT_ROLES[roleName];
  return role?.permissions || [];
}

/**
 * Create a custom admin role
 */
export async function createCustomRole(
  roleName: string,
  roleDescription: string,
  permissions: RBACPermission[]
) {
  try {
    // Validate all permissions
    for (const permission of permissions) {
      if (!isValidPermission(permission)) {
        throw new Error(`Invalid permission: ${permission}`);
      }
    }

    const customRole = await prisma.customAdminRole.create({
      data: {
        name: roleName,
        description: roleDescription,
        permissions: permissions,
      },
    });

    return customRole;
  } catch (error) {
    console.error("Failed to create custom role:", error);
    throw error;
  }
}

/**
 * Assign staff role to user
 */
export async function assignStaffRole(userId: string, roleId: string) {
  try {
    const role = await prisma.customAdminRole.findUnique({
      where: { id: roleId },
      select: { permissions: true },
    });

    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    // Upsert staff role
    const staffRole = await prisma.staffRole.upsert({
      where: { userId },
      update: {
        customAdminRoleId: roleId,
        customPermissions: role.permissions,
      },
      create: {
        userId,
        customAdminRoleId: roleId,
        customPermissions: role.permissions,
      },
    });

    return staffRole;
  } catch (error) {
    console.error(`Failed to assign role to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check platform role permission (fallback)
 */
/**
 * Get all permissions for platform role using DEFAULT_ROLES
 */
function getPlatformRolePermissions(platformRole: string): RBACPermission[] {
  const key = platformRole as keyof typeof DEFAULT_ROLES;
  const role = DEFAULT_ROLES[key];
  if (role && Array.isArray(role.permissions)) return role.permissions as RBACPermission[];
  return [];
}

/**
 * Revoke permission from user
 */
export async function revokePermission(userId: string, permission: RBACPermission) {
  try {
    const staffRole = await prisma.staffRole.findUnique({
      where: { userId },
      select: { customPermissions: true },
    });

    if (!staffRole) {
      return null;
    }

    const permissions = (staffRole.customPermissions as string[]).filter((p) => p !== permission);

    const updated = await prisma.staffRole.update({
      where: { userId },
      data: { customPermissions: permissions },
    });

    return updated;
  } catch (error) {
    console.error(`Failed to revoke permission from user ${userId}:`, error);
    throw error;
  }
}

/**
 * Grant permission to user
 */
export async function grantPermission(userId: string, permission: RBACPermission) {
  try {
    if (!isValidPermission(permission)) {
      throw new Error(`Invalid permission: ${permission}`);
    }

    const staffRole = await prisma.staffRole.findUnique({
      where: { userId },
    });

    if (!staffRole) {
      // Create new staff role with single permission
      const created = await prisma.staffRole.create({
        data: {
          userId,
          customPermissions: [permission],
        },
      });
      return created;
    }

    const permissions = (staffRole.customPermissions as string[]) || [];
    if (permissions.includes(permission)) {
      return staffRole; // Already has permission
    }

    const updated = await prisma.staffRole.update({
      where: { userId },
      data: {
        customPermissions: [...permissions, permission],
      },
    });

    return updated;
  } catch (error) {
    console.error(`Failed to grant permission to user ${userId}:`, error);
    throw error;
  }
}

/**
 * List all custom roles
 */
export async function listCustomRoles() {
  try {
    const roles = await prisma.customAdminRole.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return roles;
  } catch (error) {
    console.error("Failed to list custom roles:", error);
    throw error;
  }
}

/**
 * Delete custom role
 */
export async function deleteCustomRole(roleId: string) {
  try {
    // Check if role is in use
    const inUse = await prisma.staffRole.findFirst({
      where: { customAdminRoleId: roleId },
    });

    if (inUse) {
      throw new Error("Cannot delete role: in use by staff members");
    }

    const deleted = await prisma.customAdminRole.delete({
      where: { id: roleId },
    });

    return deleted;
  } catch (error) {
    console.error(`Failed to delete role ${roleId}:`, error);
    throw error;
  }
}
