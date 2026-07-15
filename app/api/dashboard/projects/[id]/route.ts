import { NextRequest } from "next/server";
import { TeamRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/api/response";
import { getClientIp, requireOrgAccess, requireSession } from "@/lib/api/middleware";
import { updateProjectSchema } from "@/lib/validators/projects";
import { archiveProject, deleteProject, getProject } from "@/lib/services/projects";
import { writeActivityLog } from "@/lib/services/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const { id } = await params;
  const project = await getProject(id, session.user.organizationId);
  if (!project) return apiError("not_found", "Project not found.", 404);

  return apiOk(project);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  try {
    await requireOrgAccess(session.user.id, session.user.organizationId, TeamRole.MANAGER);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const { id } = await params;
  const parsed = updateProjectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);
  }

  const project = await prisma.project.update({
    where: { id, organizationId: session.user.organizationId },
    data: parsed.data
  });

  return apiOk(project);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  try {
    await requireOrgAccess(session.user.id, session.user.organizationId, TeamRole.ADMIN);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const { id } = await params;
  const action = new URL(request.url).searchParams.get("action");

  if (action === "archive") {
    await archiveProject(id, session.user.organizationId);
  } else {
    await deleteProject(id, session.user.organizationId);
  }

  await writeActivityLog({
    organizationId: session.user.organizationId,
    actorUserId: session.user.id,
    action: action === "archive" ? "project.archived" : "project.deleted",
    entityType: "project",
    entityId: id,
    ipAddress: getClientIp(request)
  });

  return apiOk({ success: true });
}
