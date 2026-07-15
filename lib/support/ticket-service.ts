/**
 * AI Support Ticket System
 * 
 * Three-stage process:
 * 1. AI greeting and issue collection
 * 2. Ticket creation and assignment
 * 3. Support staff response and resolution
 */

import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";
import { NotificationType, Prisma } from "@prisma/client";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "ESCALATED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketCategory = "BUG" | "FEATURE_REQUEST" | "BILLING" | "TECHNICAL" | "ACCOUNT" | "OTHER";

/**
 * Create support ticket from user input
 */
export async function createSupportTicket(
  userId: string,
  userEmail: string,
  category: TicketCategory,
  subject: string,
  issue: string,
  priority: TicketPriority = "MEDIUM"
) {
  try {
    // Generate ticket reference
    const ticketRef = `TKT${Date.now().toString().slice(-6)}`;

    const ticket = await prisma.platformSupportTicket.create({
      data: {
        userId,
        userEmail,
        ticketRef,
        subject,
        description: issue,
        category,
        priority,
        status: "OPEN",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create initial AI greeting message
    await prisma.platformTicketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: "SYSTEM_AI",
        senderType: "AI",
        message: `Thank you for reaching out! We've received your ticket (${ticketRef}) and our support team will review it shortly. You can track the status of this ticket here.`,
        isAiGenerated: true,
        createdAt: new Date(),
      },
    });

    // Add user's issue as first message
    await prisma.platformTicketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        senderType: "USER",
        message: issue,
        createdAt: new Date(),
      },
    });

    return ticket;
  } catch (error) {
    console.error(`Failed to create support ticket for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get all tickets for a user
 */
export async function getUserTickets(userId: string) {
  try {
    const tickets = await prisma.platformSupportTicket.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return tickets;
  } catch (error) {
    console.error(`Failed to get tickets for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get ticket by ID
 */
export async function getTicketById(ticketId: string) {
  try {
    const ticket = await prisma.platformSupportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return ticket;
  } catch (error) {
    console.error(`Failed to get ticket ${ticketId}:`, error);
    return null;
  }
}

/**
 * Add response to ticket
 */
export async function addTicketResponse(
  ticketId: string,
  senderId: string,
  senderType: "USER" | "SUPPORT" | "ADMIN",
  message: string
) {
  try {
    const ticket = await prisma.platformSupportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const response = await prisma.platformTicketMessage.create({
      data: {
        ticketId,
        senderId,
        senderType,
        message,
        createdAt: new Date(),
      },
    });

    // Update ticket last modified
    await prisma.platformSupportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    // If response from support, mark ticket as in progress
    if (senderType === "SUPPORT" || senderType === "ADMIN") {
      await prisma.platformSupportTicket.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" },
      });

      // Send notification to user (map to Notification model)
      await sendTicketNotification(ticket.userId, ticketId, "SUPPORT_RESPONSE", {
        ticketRef: ticket.ticketRef,
      });
    }

    return response;
  } catch (error) {
    console.error(`Failed to add response to ticket ${ticketId}:`, error);
    throw error;
  }
}

/**
 * Assign ticket to support agent
 */
export async function assignTicket(ticketId: string, assigneeId: string, assignedById: string) {
  try {
    const ticket = await prisma.platformSupportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: assigneeId,
      },
    });

    // Log assignment to platform audit log
    await prisma.platformAuditLog.create({
      data: {
        action: "TICKET_ASSIGNED",
        userId: assignedById,
        targetId: ticketId,
        metadata: {
          ticketRef: ticket.ticketRef,
          assignedTo: assigneeId,
        },
      },
    });

    return ticket;
  } catch (error) {
    console.error(`Failed to assign ticket ${ticketId}:`, error);
    throw error;
  }
}

/**
 * Mark ticket as resolved
 */
export async function resolveTicket(ticketId: string, resolution: string, resolvedById: string) {
  try {
    const ticket = await prisma.platformSupportTicket.update({
      where: { id: ticketId },
      data: {
        status: "RESOLVED",
        resolution,
      },
    });

    // Add resolution message
    await prisma.platformTicketMessage.create({
      data: {
        ticketId,
        senderId: resolvedById,
        senderType: "SUPPORT",
        message: `This ticket has been marked as resolved: ${resolution}`,
        createdAt: new Date(),
      },
    });

    // Send resolution notification to user
    await sendTicketNotification(ticket.userId, ticketId, "TICKET_RESOLVED", {
      ticketRef: ticket.ticketRef,
    });

    // Log resolution to platform audit log
    await prisma.platformAuditLog.create({
      data: {
        action: "TICKET_RESOLVED",
        userId: resolvedById,
        targetId: ticketId,
        metadata: {
          ticketRef: ticket.ticketRef,
          resolution,
        },
      },
    });

    return ticket;
  } catch (error) {
    console.error(`Failed to resolve ticket ${ticketId}:`, error);
    throw error;
  }
}

/**
 * Close ticket (after resolution)
 */
export async function closeTicket(ticketId: string, _closedById: string) {
  try {
    const ticket = await prisma.platformSupportTicket.update({
      where: { id: ticketId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });

    return ticket;
  } catch (error) {
    console.error(`Failed to close ticket ${ticketId}:`, error);
    throw error;
  }
}

/**
 * Escalate ticket to higher tier support
 */
export async function escalateTicket(ticketId: string, escalationReason: string, escalatedById: string) {
  try {
    const ticket = await prisma.platformSupportTicket.update({
      where: { id: ticketId },
      data: {
        status: "ESCALATED",
        escalatedAt: new Date(),
      },
    });

    // Add escalation message
    await prisma.platformTicketMessage.create({
      data: {
        ticketId,
        senderId: escalatedById,
        senderType: "ADMIN",
        message: `Ticket escalated: ${escalationReason}`,
        createdAt: new Date(),
      },
    });

    // Notify admin
    await notifyAdminOfEscalation(ticket);

    return ticket;
  } catch (error) {
    console.error(`Failed to escalate ticket ${ticketId}:`, error);
    throw error;
  }
}

/**
 * Get all tickets (admin view)
 */
export async function getAllTickets(filters?: { status?: TicketStatus; assignedToId?: string; priority?: TicketPriority }) {
  try {
    const where: Prisma.PlatformSupportTicketWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.priority) where.priority = filters.priority;

    const tickets = await prisma.platformSupportTicket.findMany({
      where,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return tickets;
  } catch (error) {
    console.error("Failed to get all tickets:", error);
    return [];
  }
}

/**
 * Get ticket statistics
 */
export async function getTicketStats() {
  try {
    const stats = await prisma.platformSupportTicket.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const priorities = await prisma.platformSupportTicket.groupBy({
      by: ["priority"],
      _count: {
        id: true,
      },
    });

    return {
      byStatus: stats.reduce(
        (acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
      byPriority: priorities.reduce(
        (acc, p) => {
          acc[p.priority] = p._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
      total: stats.reduce((sum, s) => sum + s._count.id, 0),
    };
  } catch (error) {
    console.error("Failed to get ticket statistics:", error);
    return null;
  }
}

/**
 * Detect issue priority from content
 */
export function detectIssuePriority(issueText: string): TicketPriority {
  const criticalKeywords = ["down", "broken", "urgent", "critical", "emergency", "not working"];
  const highKeywords = ["error", "bug", "issue", "payment", "verification failed"];
  const mediumKeywords = ["question", "help", "how to", "feature"];

  const lowerText = issueText.toLowerCase();

  if (criticalKeywords.some((k) => lowerText.includes(k))) {
    return "CRITICAL";
  }
  if (highKeywords.some((k) => lowerText.includes(k))) {
    return "HIGH";
  }
  if (mediumKeywords.some((k) => lowerText.includes(k))) {
    return "MEDIUM";
  }

  return "LOW";
}

/**
 * Detect issue category from content
 */
export function detectIssueCategory(issueText: string): TicketCategory {
  const text = issueText.toLowerCase();

  if (text.includes("bill") || text.includes("payment") || text.includes("subscription") || text.includes("plan")) {
    return "BILLING";
  }
  if (text.includes("bug") || text.includes("error") || text.includes("crash") || text.includes("issue")) {
    return "BUG";
  }
  if (text.includes("account") || text.includes("login") || text.includes("password") || text.includes("email")) {
    return "ACCOUNT";
  }
  if (text.includes("api") || text.includes("integration") || text.includes("webhook")) {
    return "TECHNICAL";
  }
  if (text.includes("feature") || text.includes("suggestion") || text.includes("request")) {
    return "FEATURE_REQUEST";
  }

  return "OTHER";
}

/**
 * Send ticket notification to user
 */
async function sendTicketNotification(
  userId: string,
  ticketId: string,
  notificationType: "SUPPORT_RESPONSE" | "TICKET_RESOLVED",
  metadata: { ticketRef?: string }
) {
  try {
    const title =
      notificationType === "SUPPORT_RESPONSE"
        ? `New Response to Your Support Ticket ${metadata.ticketRef}`
        : `Your Support Ticket ${metadata.ticketRef} Has Been Resolved`;

    const body =
      notificationType === "SUPPORT_RESPONSE"
        ? "A support agent has responded to your ticket. Check it out for the latest update."
        : "Great news! Your support ticket has been resolved.";

    const mappedType = notificationType === "SUPPORT_RESPONSE" ? NotificationType.INFO : NotificationType.SUCCESS;

    // Find user's organization to associate notification
    const member = await prisma.teamMember.findFirst({ where: { userId }, select: { organizationId: true } });
    if (!member) {
      console.warn(`No organization found for user ${userId}; skipping notification.`);
      return;
    }

    await createNotification({
      organizationId: member.organizationId,
      userId,
      type: mappedType,
      title,
      body,
    });
  } catch (error) {
    console.error("Failed to send ticket notification:", error);
  }
}

/**
 * Notify admin of ticket escalation
 */
async function notifyAdminOfEscalation(ticket: { id: string; subject?: string; ticketRef?: string; userEmail?: string; escalationReason?: string; }) {
  try {
    // Find admin users
    const admins = await prisma.user.findMany({
      where: {
        platformRole: "ADMIN",
      },
      select: { id: true },
    });

    // Send notification to each admin. Use admin's organization if available.
    for (const admin of admins) {
      const adminMember = await prisma.teamMember.findFirst({ where: { userId: admin.id }, select: { organizationId: true } });
      if (!adminMember) continue;

      await createNotification({
        organizationId: adminMember.organizationId,
        userId: admin.id,
        type: NotificationType.WARNING,
        title: `Ticket Escalated: ${ticket.subject}`,
        body: `Support ticket ${ticket.ticketRef} from ${ticket.userEmail} has been escalated.`,
      });
    }
  } catch (error) {
    console.error("Failed to notify admins of escalation:", error);
  }
}

/**
 * Search tickets (admin)
 */
export async function searchTickets(query: string) {
  try {
    const tickets = await prisma.platformSupportTicket.findMany({
      where: {
        OR: [
          { ticketRef: { contains: query, mode: "insensitive" } },
          { subject: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { userEmail: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return tickets;
  } catch (error) {
    console.error("Failed to search tickets:", error);
    return [];
  }
}
