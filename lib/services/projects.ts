import { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createApiKey } from "@/lib/security/api-keys";
import { cacheGet, cacheSet } from "@/lib/server-cache";

export async function createProject(input: {
  organizationId: string;
  name: string;
  description?: string;
  upiId?: string;
}) {
  const secret = createApiKey("sk", "live");
  const publicKey = createApiKey("pk", "live");

  const project = await prisma.project.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      upiId: input.upiId,
      publicKey: publicKey.key,
      secretKeyHash: secret.keyHash,
      status: ProjectStatus.ACTIVE
    }
  });

  await prisma.apiKey.createMany({
    data: [
      {
        organizationId: input.organizationId,
        projectId: project.id,
        name: `${input.name} Secret`,
        keyPrefix: secret.keyPrefix,
        keyHash: secret.keyHash,
        type: "SECRET",
        scopes: ["orders:write", "orders:read", "transactions:read"]
      },
      {
        organizationId: input.organizationId,
        projectId: project.id,
        name: `${input.name} Public`,
        keyPrefix: publicKey.keyPrefix,
        keyHash: publicKey.keyHash,
        type: "PUBLIC",
        scopes: ["orders:read"]
      }
    ]
  });

  return { project, secretKey: secret.key };
}

export async function regenerateProjectKeys(projectId: string, organizationId: string) {
  const secret = createApiKey("sk", "live");

  await prisma.apiKey.updateMany({
    where: { projectId, organizationId, type: "SECRET", revokedAt: null },
    data: { revokedAt: new Date() }
  });

  await prisma.apiKey.create({
    data: {
      organizationId,
      projectId,
      name: "Regenerated Secret",
      keyPrefix: secret.keyPrefix,
      keyHash: secret.keyHash,
      type: "SECRET",
      scopes: ["orders:write", "orders:read", "transactions:read"]
    }
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { secretKeyHash: secret.keyHash }
  });

  return secret.key;
}

export async function listProjects(organizationId: string) {
  const cacheKey = `projects:${organizationId}`;
  const cached = cacheGet<any>(cacheKey);
  if (cached) return cached;
  const projects = await prisma.project.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      webhooks: {
        select: {
          status: true,
          deliveries: { orderBy: { createdAt: "desc" }, take: 5, select: { status: true } }
        }
      },
      _count: { select: { products: true } }
    }
  });

  const projectIds = projects.map((p) => p.id);
  let ordersAgg: Array<{ projectId: string; _sum: { amount: number | null }; _count: { _all: number } }> = [];
  if (projectIds.length) {
    // groupBy orders by projectId and status to compute revenue and counts efficiently
    const raw = await prisma.order.groupBy({
      by: ["projectId", "status"],
      where: { projectId: { in: projectIds } },
      _sum: { amount: true },
      _count: { _all: true }
    });
    ordersAgg = raw as any;
  }

  const aggByProject: Record<string, { total: number; paid: number; revenue: number }> = {};
  for (const row of ordersAgg) {
    const pid = row.projectId;
    if (!aggByProject[pid]) aggByProject[pid] = { total: 0, paid: 0, revenue: 0 };
    aggByProject[pid].total += row._count._all ?? 0;
    if (row.status === "PAID" || row.status === "VERIFIED") {
      aggByProject[pid].paid += row._count._all ?? 0;
      aggByProject[pid].revenue += Number(row._sum.amount ?? 0);
    }
  }

  const result = projects.map((project) => {
    const ag = aggByProject[project.id] ?? { total: 0, paid: 0, revenue: 0 };
    const webhookDeliveries = project.webhooks.flatMap((webhook) => webhook.deliveries);
    const webhookSuccessRate = webhookDeliveries.length
      ? Math.round((webhookDeliveries.filter((delivery) => delivery.status === "SUCCESS").length / webhookDeliveries.length) * 100)
      : 100;

    return {
      ...project,
      webhooks: undefined,
      metrics: {
        revenue: ag.revenue,
        paidOrders: ag.paid,
        verificationRate: ag.total ? Math.round((ag.paid / ag.total) * 100) : 0,
        webhookSuccessRate
      }
    };
  });

  try { cacheSet(cacheKey, result); } catch (_) {}
  return result;
}

// Backwards-compatible alias for older callers expecting `listUserProjects`
export async function listUserProjects(organizationId: string) {
  return listProjects(organizationId);
}

export async function getProject(projectId: string, organizationId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, organizationId, deletedAt: null },
    include: {
      _count: { select: { orders: true, products: true, transactions: true } }
    }
  });
}

export async function archiveProject(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId } });
  if (!project) throw new Error("Project not found.");
  return prisma.project.update({
    where: { id: project.id },
    data: { status: ProjectStatus.ARCHIVED, archivedAt: new Date() }
  });
}

export async function deleteProject(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId } });
  if (!project) throw new Error("Project not found.");
  return prisma.project.update({
    where: { id: project.id },
    data: { deletedAt: new Date(), status: ProjectStatus.DISABLED }
  });
}
