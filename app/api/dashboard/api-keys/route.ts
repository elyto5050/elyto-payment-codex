import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const keys = await prisma.apiKey.findMany({
    where: { organizationId: session.user.organizationId, revokedAt: null },
    orderBy: { createdAt: "desc" }
  });

  const projectIds = [...new Set(keys.map((k) => k.projectId).filter(Boolean))] as string[];
  const projects = projectIds.length
    ? await prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } })
    : [];
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return apiOk(
    keys.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ keyHash, projectId, ...safe }) => ({
        ...safe,
        projectId,
        project: projectId ? projectMap.get(projectId) ?? null : null
      })
    )
  );
}
