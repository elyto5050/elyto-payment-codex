import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { getUnreadCount, listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/services/notifications";
import { startSpan } from "@/lib/trace";
import { attachPrismaQueryCollector, clearPrismaQueryCollector } from "@/lib/db/prismaQueryCollector";

export async function GET(request: NextRequest) {
  // Support debug bypass using `x-trace-org` and `x-trace-user` headers
  const traceOrg = request.headers.get("x-trace-org");
  const traceUser = request.headers.get("x-trace-user");
  let orgId: string | undefined;
  let userId: string | undefined;
  if (traceOrg && process.env.NODE_ENV !== "production") {
    orgId = traceOrg;
    userId = traceUser ?? undefined;
  } else {
    const session = await requireSession(request);
    if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);
    orgId = session.user.organizationId;
    userId = session.user.id;
  }

  const reqSpan = startSpan("api:/api/dashboard/notifications");
  const queries = attachPrismaQueryCollector();
  try {
    const listSpan = startSpan("listNotifications");
    const unreadSpan = startSpan("getUnreadCount");

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "25");

    const listP = (async () => {
      const res = await listNotifications(orgId, userId, page, pageSize);
      const entry = listSpan.end();
      return { res, entry };
    })();

    const unreadP = (async () => {
      const res = await getUnreadCount(orgId, userId);
      const entry = unreadSpan.end();
      return { res, entry };
    })();

    const [listResp, unreadResp] = await Promise.all([listP, unreadP]);

    const notifications = listResp.res;
    const total = listResp.total ?? 0;
    const unreadCount = unreadResp.res;

    const listDur = listResp.entry?.durationMs ?? 0;
    const unreadDur = unreadResp.entry?.durationMs ?? 0;

    reqSpan.end({ queries, parts: { listNotifications: listDur, getUnreadCount: unreadDur } });
    const totalDur = Math.round(listDur + unreadDur);
    const serverTiming = `total;dur=${totalDur}, listNotifications;dur=${Math.round(listDur)}, getUnreadCount;dur=${Math.round(unreadDur)}`;
    const debug = traceOrg && process.env.NODE_ENV !== "production" ? { queries, parts: { listNotifications: listDur, getUnreadCount: unreadDur } } : undefined;
    const meta = { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    const payload = debug ? { data: { notifications, unreadCount }, meta, debug } : { data: { notifications, unreadCount }, meta };
    return apiOk(payload, { headers: { "Server-Timing": serverTiming } });
  } finally {
    clearPrismaQueryCollector();
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const body = await request.json();

  if (body.all) {
    await markAllNotificationsRead(session.user.organizationId, session.user.id);
    return apiOk({ success: true });
  }

  if (body.id) {
    await markNotificationRead(body.id, session.user.organizationId);
    return apiOk({ success: true });
  }

  return apiError("invalid_request", "id or all required.", 422);
}
