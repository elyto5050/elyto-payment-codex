import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? "50")));

  const where = { organizationId: session.user.organizationId ?? session.user.id, userId };
  const total = await prisma.notification.count({ where });
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  const meta = { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  return NextResponse.json({ data: { notifications }, meta });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const payload = await request.json();
  const { title, body, userId, broadcast, type } = payload;
  const organizationId = session.user.organizationId ?? session.user.id;

  if (broadcast && session.user.platformRole !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const created = await createNotification({
    organizationId,
    userId: broadcast ? null : userId ?? session.user.id,
    title,
    body,
    type: type ?? "INFO"
  });

  return NextResponse.json(created);
}
