import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { getOrderStats } from "@/lib/services/orders";
import { listProjects } from "@/lib/services/projects";
import { prisma } from "@/lib/db/prisma";
import { startSpan } from "@/lib/trace";
import { attachPrismaQueryCollector, clearPrismaQueryCollector } from "@/lib/db/prismaQueryCollector";

export async function GET(request: NextRequest) {
  // Allow a safe debug bypass for local tracing: set header `x-trace-org` to an organizationId
  // Only enabled when not in production to avoid accidental exposure.
  const traceOrg = request.headers.get("x-trace-org");
  let orgId: string | undefined;
  if (traceOrg && process.env.NODE_ENV !== "production") {
    orgId = traceOrg;
  } else {
    const session = await requireSession(request);
    if (!session?.user.organizationId) {
      return apiError("unauthorized", "Sign in required.", 401);
    }
    orgId = session.user.organizationId;
  }
  // Request-level tracing
  const reqSpan = startSpan("api:/api/dashboard/stats");
  const queries = attachPrismaQueryCollector();

  try {
    const statsSpan = startSpan("getOrderStats");
    const projectsSpan = startSpan("listProjects");
    const ordersSpan = startSpan("prisma.order.findMany");

    const statsP = (async () => {
      const res = await getOrderStats(orgId);
      const entry = statsSpan.end();
      return { res, entry };
    })();

    const projectsP = (async () => {
      const res = await listProjects(orgId);
      const entry = projectsSpan.end();
      return { res, entry };
    })();

    const ordersP = (async () => {
      const res = await prisma.order.findMany({
        where: { project: { organizationId: orgId } },
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8
      });
      const entry = ordersSpan.end();
      return { res, entry };
    })();

    const [statsResp, projectsResp, ordersResp] = await Promise.all([statsP, projectsP, ordersP]);

    const stats = statsResp.res;
    const projects = projectsResp.res;
    const recentOrders = ordersResp.res;

    const statsDur = statsResp.entry?.durationMs ?? 0;
    const projectsDur = projectsResp.entry?.durationMs ?? 0;
    const ordersDur = ordersResp.entry?.durationMs ?? 0;

    const totalParts = Math.round(statsDur + projectsDur + ordersDur);
    const serverTiming = `total;dur=${totalParts}, getOrderStats;dur=${statsDur}, listProjects;dur=${projectsDur}, orders;dur=${ordersDur}`;

    reqSpan.end({ queries, parts: { stats: statsDur, projects: projectsDur, orders: ordersDur } });

    const debug = traceOrg && process.env.NODE_ENV !== "production" ? { queries, parts: { stats: statsDur, projects: projectsDur, orders: ordersDur } } : undefined;

    return apiOk(
      {
        stats: {
          ...stats,
          activeProjects: projects.filter((p: { status?: string }) => p.status === "ACTIVE").length,
          webhookSuccessRate: 100
        },
        recentOrders,
        ...(debug ? { debug } : {})
      },
      { headers: { "Server-Timing": serverTiming } }
    );
  } finally {
    // clear per-request collector
    clearPrismaQueryCollector();
  }
}
