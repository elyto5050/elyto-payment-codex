/**
 * Admin Staff Permission Assignment API
 * Routes for assigning roles and permissions to staff members
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, assignStaffRole, getUserPermissions } from "@/lib/rbac/service";

/**
 * GET /api/admin/rbac/staff/:userId/permissions
 * Get all permissions for a staff member
 */
export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await hasPermission(session.user.id, "admin:manage-roles");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await context.params;
    const permissions = await getUserPermissions(userId);
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Failed to get staff permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/rbac/staff/:userId/assign-role
 * Assign a role to staff member
 */
export async function POST(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await hasPermission(session.user.id, "admin:manage-roles");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { roleId } = body;
    if (!roleId) return NextResponse.json({ error: "Role ID required" }, { status: 400 });

    const { userId } = await context.params;
    const staffRole = await assignStaffRole(userId, roleId);
    return NextResponse.json({ staffRole });
  } catch (error: unknown) {
    console.error("Failed to assign role:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}

// Permission-specific handlers moved to
// app/api/admin/rbac/staff/[userId]/permissions/[permission]/route.ts
