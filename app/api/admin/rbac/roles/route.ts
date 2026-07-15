/**
 * Admin RBAC API Endpoints
 * Routes for managing roles, permissions, and staff access
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, listCustomRoles, createCustomRole, deleteCustomRole, assignStaffRole } from "@/lib/rbac/service";
import type { RBACPermission } from "@/lib/rbac/permissions";

/**
 * GET /api/admin/rbac/roles
 * List all custom admin roles
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canManage = await hasPermission(session.user.id, "admin:manage-roles");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roles = await listCustomRoles();
    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Failed to list roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/rbac/roles
 * Create new custom role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canManage = await hasPermission(session.user.id, "admin:manage-roles");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { roleName, roleDescription, permissions } = body;

    if (!roleName || !Array.isArray(permissions)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const role = await createCustomRole(roleName, roleDescription || "", permissions as RBACPermission[]);

    return NextResponse.json({ role }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create role:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}
