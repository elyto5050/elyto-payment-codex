import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { project: { organizationId: session.user.organizationId } },
    include: {
      project: { select: { name: true } },
      deliveries: { orderBy: { createdAt: "desc" }, take: 5 }
    }
  });

  const health = endpoints.map((ep) => {
    const recent = ep.deliveries;
    const successRate = recent.length ? (recent.filter((d) => d.status === "SUCCESS").length / recent.length) * 100 : 100;
    const lastDelivery = recent[0];
    return {
      id: ep.id,
      name: ep.name,
      url: ep.url,
      project: ep.project.name,
      status: ep.status,
      successRate: Math.round(successRate),
      healthy: successRate >= 80,
      lastDelivery: lastDelivery
        ? { status: lastDelivery.status, at: lastDelivery.lastAttemptAt, error: lastDelivery.errorMessage }
        : null
    };
  });

  return apiOk(health);
}
