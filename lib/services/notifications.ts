import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { cacheGet, cacheSet, cacheDel } from "@/lib/server-cache";

export async function createNotification(input: {
  organizationId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  body: string;
}) {
  const rec = await prisma.notification.create({ data: input });
  // Invalidate unread count cache for the affected user/org
  try {
    if (input.userId) cacheDel(`unread:${input.organizationId}:${input.userId}`);
    cacheDel(`unread:${input.organizationId}:all`);
  } catch (_) {}
  return rec;
}

export async function listNotifications(organizationId: string, userId?: string, page = 1, pageSize = 25) {
  // Only return notifications targeted to the specific user
  const where: any = { organizationId };
  if (userId) where.userId = userId;

  const total = await prisma.notification.count({ where });

  const res = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (Math.max(1, page) - 1) * pageSize,
    take: pageSize
  });

  return { res, total };
}

export async function markNotificationRead(id: string, organizationId: string) {
  const res = await prisma.notification.updateMany({ where: { id, organizationId }, data: { readAt: new Date() } });
  try { cacheDel(`unread:${organizationId}:all`); } catch (_) {}
  return res;
}

export async function markAllNotificationsRead(organizationId: string, userId?: string) {
  if (!userId) {
    const res = await prisma.notification.updateMany({ where: { organizationId, readAt: null }, data: { readAt: new Date() } });
    try { cacheDel(`unread:${organizationId}:all`); } catch (_) {}
    return res;
  }
  const r = await prisma.notification.updateMany({ where: { organizationId, userId, readAt: null }, data: { readAt: new Date() } });
  try { cacheDel(`unread:${organizationId}:${userId}`); cacheDel(`unread:${organizationId}:all`); } catch (_) {}
  return r;
}

export async function getUnreadCount(organizationId: string, userId?: string) {
  const cacheKey = `unread:${organizationId}:${userId ?? "all"}`;
  const cached = cacheGet<number>(cacheKey);
  if (typeof cached === "number") return cached;
  const count = await prisma.notification.count({ where: { organizationId, ...(userId ? { userId } : {}), readAt: null } });
  try { cacheSet(cacheKey, count, 2_000); } catch (_) {}
  return count;
}
