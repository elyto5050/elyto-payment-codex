import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await prisma.user.update({ where: { id: userId }, data: { deactivatedAt: new Date() } });
    // Delete all sessions to sign the user out everywhere
    await prisma.session.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
