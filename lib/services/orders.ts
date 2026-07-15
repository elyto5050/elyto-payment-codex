import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { writeActivityLog } from "@/lib/services/audit";

export async function createOrder(input: {
  projectId: string;
  productId?: string;
  customerName?: string;
  customerEmail?: string;
  amount: number;
  currency?: string;
  organizationId?: string;
  actorUserId?: string;
}) {
  const order = await prisma.order.create({
    data: {
      publicId: `ord_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`,
      projectId: input.projectId,
      productId: input.productId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      amount: input.amount,
      currency: input.currency ?? "INR",
      status: OrderStatus.PENDING,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    }
  });

  await prisma.webhookEvent.create({
    data: {
      projectId: input.projectId,
      orderId: order.id,
      type: "order.created",
      payload: {
        event: "order.created",
        orderId: order.publicId,
        amount: order.amount,
        currency: order.currency,
        status: order.status
      }
    }
  });

  if (input.organizationId) {
    await writeActivityLog({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "order.created",
      entityType: "order",
      entityId: order.id
    });
  }

  return order;
}

export async function submitOrderUtr(orderId: string, utr: string) {
  const existing = await prisma.order.findFirst({
    where: { submittedUtr: utr, NOT: { publicId: orderId } }
  });

  if (existing) {
    throw new Error("UTR already submitted on another order.");
  }

  const order = await prisma.order.update({
    where: { publicId: orderId },
    data: {
      submittedUtr: utr,
      status: OrderStatus.UTR_SUBMITTED
    },
    include: { project: true }
  });

  await prisma.webhookEvent.create({
    data: {
      projectId: order.projectId,
      orderId: order.id,
      type: "order.utr_submitted",
      payload: {
        event: "order.utr_submitted",
        orderId: order.publicId,
        utr,
        status: order.status
      }
    }
  });

  return order;
}

export async function listOrders(organizationId: string, projectId?: string, page = 1, pageSize = 25) {
  const where = {
    project: { organizationId, deletedAt: null },
    ...(projectId ? { projectId } : {})
  };

  const total = await prisma.order.count({ where });
  const take = Math.min(1000, Math.max(1, pageSize));
  const skip = Math.max(0, (page - 1) * take);

  const data = await prisma.order.findMany({
    where,
    include: {
      product: { select: { name: true } },
      project: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take
  });

  return {
    data,
    meta: {
      total,
      page,
      pageSize: take,
      totalPages: Math.max(1, Math.ceil(total / take))
    }
  };
}

export async function getOrderStats(organizationId: string) {
  // Fetch project IDs for the organization, then run fast aggregated queries by projectId
  const projects = await prisma.project.findMany({ where: { organizationId, deletedAt: null }, select: { id: true } });
  const projectIds = projects.map((p) => p.id);
  if (projectIds.length === 0) {
    return { totalOrders: 0, paidOrders: 0, failedOrders: 0, revenue: 0, verificationRate: 0 };
  }

  const totalOrdersP = prisma.order.count({ where: { projectId: { in: projectIds } } });
  const paidOrdersP = prisma.order.count({ where: { projectId: { in: projectIds }, status: { in: [OrderStatus.VERIFIED, OrderStatus.PAID] } } });
  const failedOrdersP = prisma.order.count({ where: { projectId: { in: projectIds }, status: OrderStatus.FAILED } });
  const revenueP = prisma.order.aggregate({ where: { projectId: { in: projectIds }, status: { in: [OrderStatus.VERIFIED, OrderStatus.PAID] } }, _sum: { amount: true } });

  const [totalOrders, paidOrders, failedOrders, revenueRes] = await Promise.all([totalOrdersP, paidOrdersP, failedOrdersP, revenueP]);
  const revenue = Number(revenueRes._sum.amount ?? 0);
  const verificationRate = totalOrders ? (paidOrders / totalOrders) * 100 : 0;

  return {
    totalOrders,
    paidOrders,
    failedOrders,
    revenue,
    verificationRate: Math.round(verificationRate * 100) / 100
  };
}
