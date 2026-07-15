import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest, context: any) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);
  const params = context?.params ?? {};
  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id }, include: { messages: { orderBy: { createdAt: "asc" } } } });

  if (!ticket || ticket.organizationId !== session.user.organizationId) return apiError("not_found", "Ticket not found.", 404);

  return apiOk(ticket);
}

const replySchema = z.object({ message: z.string().min(1).max(5000), action: z.enum(["reply", "resolve"]).optional() });

export async function POST(request: NextRequest, context: any) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const parsed = replySchema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Invalid request.", 422);

  const params = context?.params ?? {};
  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket || ticket.organizationId !== session.user.organizationId) return apiError("not_found", "Ticket not found.", 404);

  const message = await prisma.supportTicketMessage.create({
    data: { ticketId: ticket.id, body: parsed.data.message, authorId: session.user.id }
  });

  if (parsed.data.action === "resolve") {
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: "RESOLVED" } });
    try {
      const firstMsg = await prisma.supportTicketMessage.findFirst({ where: { ticketId: ticket.id }, orderBy: { createdAt: "asc" }, select: { authorId: true } });
      await createNotification({ organizationId: ticket.organizationId, userId: firstMsg?.authorId ?? null, title: `Your support ticket has been resolved`, body: `Ticket: ${ticket.subject}` });
    } catch (e) {
      // ignore
    }
  }

  // Notify org staff
  try {
    await createNotification({ organizationId: ticket.organizationId, title: `Update on ticket: ${ticket.subject}`, body: parsed.data.message });
  } catch (e) {
    // ignore
  }

  return apiOk({ message });
}
