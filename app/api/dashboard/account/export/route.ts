import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session || !session.user || !session.user.id) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, createdAt: true, deactivatedAt: true, deletedAt: true } });
    const billing = await prisma.billingRecord.findUnique({ where: { userId } });
    const tickets = await prisma.platformSupportTicket.findMany({ where: { userId }, include: { messages: true } });
    const teamMemberships = await prisma.teamMember.findMany({ where: { userId } });

    const payload = { user, billing, tickets, teamMemberships, exportedAt: new Date().toISOString() };

    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="elyto-export-${userId}.json"`
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
