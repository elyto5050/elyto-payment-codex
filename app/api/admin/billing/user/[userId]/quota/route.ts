import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/service";
import { adjustVerificationCount } from "@/lib/billing/service";

/**
 * PUT /api/admin/billing/user/:userId/quota
 * Admin: Adjust verification quota (for support cases)
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canManage = await hasPermission(session.user.id, "billing:custom-offers");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { adjustment, reason } = body;

    if (typeof adjustment !== "number" || !reason) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { userId } = await context.params;
    const result = await adjustVerificationCount(userId, adjustment, reason);
    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("Failed to adjust quota:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}
