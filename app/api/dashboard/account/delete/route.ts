import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { scheduleAccountDeletion, permanentlyDeleteAccount } from "@/lib/services/account";
import { queues } from "@/lib/queues";

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });

    // If queues are configured, schedule permanent deletion after 7 days; otherwise delete immediately
    if (queues?.accountDeletion) {
      await scheduleAccountDeletion(userId);
      // delete sessions immediately to sign out
      await prisma.session.deleteMany({ where: { userId } });
      return NextResponse.json({ scheduled: true });
    }

    await permanentlyDeleteAccount(userId);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
