import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { notifyNotificationUpdate, notifyUser } from "@/lib/notifications";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const payload = await request.json();

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (notification.userId && notification.userId !== session.user.id && session.user.platformRole !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.notification.update({ where: { id }, data: { readAt: payload.read ? new Date() : null } });

  const targetUser = updated.userId ?? session.user.id;
  notifyNotificationUpdate(targetUser, { id: updated.id, read: !!updated.readAt });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (notification.userId && notification.userId !== session.user.id && session.user.platformRole !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.notification.delete({ where: { id } });
  const targetUser = notification.userId ?? session.user.id;
  notifyUser(targetUser, { event: "deleted", id });

  return NextResponse.json({ ok: true });
}
