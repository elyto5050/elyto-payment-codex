import { NextRequest } from "next/server";
import { TeamRole } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api/response";
import { requireOrgAccess, requireSession } from "@/lib/api/middleware";
import { regenerateProjectKeys } from "@/lib/services/projects";
import { writeAuditLog } from "@/lib/services/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  try {
    await requireOrgAccess(session.user.id, session.user.organizationId, TeamRole.ADMIN);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const { id } = await params;
  const secretKey = await regenerateProjectKeys(id, session.user.organizationId);

  await writeAuditLog({
    organizationId: session.user.organizationId,
    actorUserId: session.user.id,
    action: "project.keys_regenerated",
    targetType: "project",
    targetId: id
  });

  return apiOk({ secretKey });
}
