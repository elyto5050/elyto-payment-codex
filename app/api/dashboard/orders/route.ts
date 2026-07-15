import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { listOrders } from "@/lib/services/orders";
import { startSpan } from "@/lib/trace";
import { attachPrismaQueryCollector, clearPrismaQueryCollector } from "@/lib/db/prismaQueryCollector";

export async function GET(request: NextRequest) {
  // Allow debug bypass with `x-trace-org` header in non-production
  const traceOrg = request.headers.get("x-trace-org");
  let orgId: string | undefined;
  if (traceOrg && process.env.NODE_ENV !== "production") {
    orgId = traceOrg;
  } else {
    const session = await requireSession(request);
    if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);
    orgId = session.user.organizationId;
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") ?? undefined;
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") || "25"));

  const reqSpan = startSpan("api:/api/dashboard/orders");
  const queries = attachPrismaQueryCollector();
  try {
    const listSpan = startSpan("listOrders");
    const result = await listOrders(orgId, projectId, page, pageSize);
    const listEntry = listSpan.end();
    const listDur = listEntry?.durationMs ?? 0;

    reqSpan.end({ queries, parts: { listOrders: listDur } });

    const debug = traceOrg && process.env.NODE_ENV !== "production" ? { queries, parts: { listOrders: listDur } } : undefined;
    const serverTiming = `total;dur=${Math.round(listDur)}, listOrders;dur=${Math.round(listDur)}`;
    return apiOk(debug ? { data: result.data, meta: result.meta, debug } : { data: result.data, meta: result.meta }, { headers: { "Server-Timing": serverTiming } });
  } finally {
    clearPrismaQueryCollector();
  }
}
