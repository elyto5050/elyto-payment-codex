import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { escalateTicket } from "@/lib/support/ticket-service";
import { hasPermission } from "@/lib/rbac/service";

export async function PUT(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canEscalate = await hasPermission(session.user.id, "support:escalate");
    if (!canEscalate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { escalationReason } = body;

    if (!escalationReason) {
      return NextResponse.json({ error: "Escalation reason required" }, { status: 400 });
    }

    const { ticketId } = await context.params;
    const ticket = await escalateTicket(ticketId, escalationReason, session.user.id);
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Failed to escalate ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
