import { NextRequest } from "next/server";
import { TeamRole } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api/response";
import { getClientIp, requireOrgAccess, requireSession } from "@/lib/api/middleware";
import { createProjectSchema } from "@/lib/validators/projects";
import { createProject, listProjects } from "@/lib/services/projects";
import { writeActivityLog } from "@/lib/services/audit";
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

  const reqSpan = startSpan("api:/api/dashboard/projects");
  const queries = attachPrismaQueryCollector();
  try {
    const listSpan = startSpan("listProjects");
    const projects = await listProjects(orgId);
    const listEntry = listSpan.end();
    const listDur = listEntry?.durationMs ?? 0;

    reqSpan.end({ queries, parts: { listProjects: listDur } });
    const debug = traceOrg && process.env.NODE_ENV !== "production" ? { queries, parts: { listProjects: listDur } } : undefined;
    const serverTiming = `total;dur=${Math.round(listDur)}, listProjects;dur=${Math.round(listDur)}`;
    return apiOk(debug ? { data: projects, debug } : projects, { headers: { "Server-Timing": serverTiming } });
  } finally {
    clearPrismaQueryCollector();
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  try {
    await requireOrgAccess(session.user.id, session.user.organizationId, TeamRole.MANAGER);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const parsed = createProjectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);
  }

  const { project, secretKey } = await createProject({
    organizationId: session.user.organizationId,
    ...parsed.data
  });

  await writeActivityLog({
    organizationId: session.user.organizationId,
    actorUserId: session.user.id,
    action: "project.created",
    entityType: "project",
    entityId: project.id,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined
  });

  return apiOk({ project, secretKey }, { status: 201 });
}
