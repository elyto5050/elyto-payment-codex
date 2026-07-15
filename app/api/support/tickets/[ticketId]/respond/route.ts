import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addTicketResponse } from "@/lib/support/ticket-service";
import { hasPermission } from "@/lib/rbac/service";

export async function POST(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Determine sender type based on permissions
    let senderType: "USER" | "SUPPORT" | "ADMIN" = "USER";
    const isSupport = await hasPermission(session.user.id, "support:respond");
    const isAdmin = session.user.platformRole === "ADMIN";

    if (isAdmin) senderType = "ADMIN";
    else if (isSupport) senderType = "SUPPORT";

    const { ticketId } = await context.params;
    const response = await addTicketResponse(ticketId, session.user.id, senderType, message);

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error("Failed to add response:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
