import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? "25")));
  const type = url.searchParams.get("type") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const where: any = { organizationId: session.user.organizationId };
  if (type && type !== "all") where.entityType = type;
  if (search) {
    const q = search.trim();
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entityType: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      { ipAddress: { contains: q, mode: "insensitive" } }
    ];
  }

  const total = await prisma.activityLog.count({ where });
  const logs = await prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });

  const meta = { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  return apiOk({ data: logs, meta });
}
