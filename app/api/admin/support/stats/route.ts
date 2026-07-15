import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTicketStats } from "@/lib/support/ticket-service";
import { hasPermission } from "@/lib/rbac/service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canView = await hasPermission(session.user.id, "support:view-tickets");
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await getTicketStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Failed to get ticket stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
