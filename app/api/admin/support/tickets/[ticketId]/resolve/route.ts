import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveTicket } from "@/lib/support/ticket-service";
import { hasPermission } from "@/lib/rbac/service";

export async function PUT(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canClose = await hasPermission(session.user.id, "support:close-ticket");
    if (!canClose) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { resolution } = body;

    if (!resolution) {
      return NextResponse.json({ error: "Resolution required" }, { status: 400 });
    }

    const { ticketId } = await context.params;
    const ticket = await resolveTicket(ticketId, resolution, session.user.id);
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Failed to resolve ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
