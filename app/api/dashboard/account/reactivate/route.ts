import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session || !session.user || !session.user.id) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, deletedAt: true } });
    if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (user.deletedAt) return NextResponse.json({ error: "deleted_account" }, { status: 400 });

    await prisma.user.update({ where: { id: userId }, data: { deactivatedAt: null } });
    return NextResponse.json({ reactivated: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
