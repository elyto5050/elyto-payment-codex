import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assignTicket } from "@/lib/support/ticket-service";
import { hasPermission } from "@/lib/rbac/service";

export async function PUT(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canAssign = await hasPermission(session.user.id, "support:assign");
    if (!canAssign) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { assigneeId } = body;

    if (!assigneeId) {
      return NextResponse.json({ error: "Assignee ID required" }, { status: 400 });
    }

    const { ticketId } = await context.params;
    const ticket = await assignTicket(ticketId, assigneeId, session.user.id);
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Failed to assign ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
