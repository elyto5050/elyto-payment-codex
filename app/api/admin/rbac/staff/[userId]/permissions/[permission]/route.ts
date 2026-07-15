import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, grantPermission, revokePermission } from "@/lib/rbac/service";
import type { RBACPermission } from "@/lib/rbac/permissions";

/**
 * PUT /api/admin/rbac/staff/:userId/permissions/:permission
 * Grant a specific permission to staff member
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ userId: string; permission: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await hasPermission(session.user.id, "admin:manage-roles");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, permission } = await context.params;
    const result = await grantPermission(userId, permission as RBACPermission);
    return NextResponse.json({ success: true, staffRole: result });
  } catch (error: unknown) {
    console.error("Failed to grant permission:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/rbac/staff/:userId/permissions/:permission
 * Revoke a specific permission from staff member
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ userId: string; permission: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await hasPermission(session.user.id, "admin:manage-roles");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, permission } = await context.params;
    const result = await revokePermission(userId, permission as RBACPermission);
    return NextResponse.json({ success: true, staffRole: result });
  } catch (error: unknown) {
    console.error("Failed to revoke permission:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}
