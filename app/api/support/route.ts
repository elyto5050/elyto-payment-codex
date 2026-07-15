/**
 * Support Ticket API Endpoints
 * Routes for creating and managing support tickets
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createSupportTicket,
  getUserTickets,
  addTicketResponse,
  assignTicket,
  resolveTicket,
  escalateTicket,
  getAllTickets,
  getTicketStats,
  detectIssuePriority,
  detectIssueCategory,
} from "@/lib/support/ticket-service";
import { hasPermission } from "@/lib/rbac/service";
import type { TicketCategory, TicketPriority } from "@/lib/support/ticket-service";

/**
 * POST /api/support/tickets
 * Create new support ticket
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, issue } = body;

    if (!subject || !issue) {
      return NextResponse.json({ error: "Subject and issue required" }, { status: 400 });
    }

    // Auto-detect category and priority
    const category = detectIssueCategory(issue) as TicketCategory;
    const priority = detectIssuePriority(issue) as TicketPriority;

    const ticket = await createSupportTicket(
      session.user.id,
      session.user.email || "",
      category,
      subject,
      issue,
      priority
    );

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create ticket:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/support/tickets
 * Get user's support tickets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await getUserTickets(session.user.id);
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Failed to get tickets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

