import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function getOrganizationAnalytics(organizationId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { project: { organizationId }, createdAt: { gte: since } },
    select: { status: true, amount: true, createdAt: true, verifiedAt: true }
  });

  const deliveries = await prisma.webhookDelivery.findMany({
    where: {
      event: { project: { organizationId } },
      createdAt: { gte: since }
    },
    select: { status: true }
  });

  const paid = orders.filter((o) => o.status === OrderStatus.VERIFIED || o.status === OrderStatus.PAID);
  const failed = orders.filter((o) => o.status === OrderStatus.FAILED);
  const revenue = paid.reduce((s, o) => s + Number(o.amount), 0);
  const verificationRate = orders.length ? (paid.length / orders.length) * 100 : 0;
  const webhookTotal = deliveries.length;
  const webhookSuccess = deliveries.filter((d) => d.status === "SUCCESS").length;
  const webhookSuccessRate = webhookTotal ? (webhookSuccess / webhookTotal) * 100 : 100;

  const dailyMap = new Map<string, { revenue: number; orders: number; paid: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0, paid: 0 });
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (!entry) continue;
    entry.orders += 1;
    if (order.status === OrderStatus.VERIFIED || order.status === OrderStatus.PAID) {
      entry.paid += 1;
      entry.revenue += Number(order.amount);
    }
  }

  const daily = [...dailyMap.entries()]
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      revenue,
      orders: orders.length,
      paidOrders: paid.length,
      failedOrders: failed.length,
      verificationRate: Math.round(verificationRate * 100) / 100,
      webhookSuccessRate: Math.round(webhookSuccessRate * 100) / 100,
      activeProjects: await prisma.project.count({ where: { organizationId, deletedAt: null, status: "ACTIVE" } })
    },
    daily
  };
}

export async function getPlatformMetrics() {
  const [users, projects, orders, paidOrders, transactions, gmailConnections] = await Promise.all([
    prisma.user.count(),
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: [OrderStatus.VERIFIED, OrderStatus.PAID] } } }),
    prisma.transaction.count(),
    prisma.gmailConnection.count({ where: { status: "ACTIVE" } })
  ]);

  const verificationRate = orders ? (paidOrders / orders) * 100 : 0;

  return { users, projects, orders, paidOrders, transactions, gmailConnections, verificationRate };
}

export async function aggregateDailyMetrics() {
  const projects = await prisma.project.findMany({ where: { deletedAt: null }, select: { id: true } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const project of projects) {
    const orders = await prisma.order.findMany({
      where: { projectId: project.id, createdAt: { gte: today } },
      select: { status: true, amount: true }
    });

    const paid = orders.filter((o) => o.status === OrderStatus.VERIFIED || o.status === OrderStatus.PAID);
    const failed = orders.filter((o) => o.status === OrderStatus.FAILED);
    const revenue = paid.reduce((s, o) => s + Number(o.amount), 0);

    const deliveries = await prisma.webhookDelivery.count({
      where: { event: { projectId: project.id }, createdAt: { gte: today }, status: "SUCCESS" }
    });
    const totalDeliveries = await prisma.webhookDelivery.count({
      where: { event: { projectId: project.id }, createdAt: { gte: today } }
    });

    await prisma.dailyMetric.upsert({
      where: { projectId_date: { projectId: project.id, date: today } },
      create: {
        projectId: project.id,
        date: today,
        revenue,
        orders: orders.length,
        paidOrders: paid.length,
        failedOrders: failed.length,
        verificationRate: orders.length ? (paid.length / orders.length) * 100 : 0,
        webhookSuccessRate: totalDeliveries ? (deliveries / totalDeliveries) * 100 : 100
      },
      update: {
        revenue,
        orders: orders.length,
        paidOrders: paid.length,
        failedOrders: failed.length,
        verificationRate: orders.length ? (paid.length / orders.length) * 100 : 0,
        webhookSuccessRate: totalDeliveries ? (deliveries / totalDeliveries) * 100 : 100
      }
    });
  }
}
