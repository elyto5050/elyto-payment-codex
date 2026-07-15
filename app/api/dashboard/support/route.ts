import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const tickets = await prisma.supportTicket.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } } }
  });

  return apiOk(tickets);
}

const schema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional()
});

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Invalid request.", 422);

  const ticket = await prisma.supportTicket.create({
    data: {
      organizationId: session.user.organizationId,
      subject: parsed.data.subject,
      priority: parsed.data.priority ?? "NORMAL",
      messages: {
        create: { body: parsed.data.message, authorId: session.user.id }
      }
    }
  });

  // Add AI intake greeting message (authorId null to indicate system)
  await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket.id,
      body: `Thanks for reaching out! We've received your ticket and our support team will review it shortly. Ticket reference: ${ticket.id}`
    }
  });

  // Notify organization (broadcast to org staff)
  try {
    await createNotification({
      organizationId: session.user.organizationId,
      title: `New support ticket: ${parsed.data.subject}`,
      body: parsed.data.message
    });
  } catch (err) {
    // ignore notification failures
  }

  const ticketWithMessages = await prisma.supportTicket.findUnique({
    where: { id: ticket.id },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });

  return apiOk(ticketWithMessages, { status: 201 });
}
