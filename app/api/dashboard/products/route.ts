import { NextRequest } from "next/server";
import { TeamRole, type Prisma } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api/response";
import { requireOrgAccess, requireSession } from "@/lib/api/middleware";
import { createProductSchema } from "@/lib/validators/projects";
import { createProduct } from "@/lib/services/products";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const projectId = url.searchParams.get("projectId") || undefined;
  const sort = (url.searchParams.get("sort") as string) || "newest";
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "25")));

  const where: Prisma.ProductWhereInput = { deletedAt: null, project: { organizationId: session.user.organizationId, deletedAt: null } };
  if (projectId) where.projectId = projectId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { project: { name: { contains: search, mode: "insensitive" } } }
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput;
  if (sort === "price_asc") orderBy = { price: "asc" } as Prisma.ProductOrderByWithRelationInput;
  else if (sort === "price_desc") orderBy = { price: "desc" } as Prisma.ProductOrderByWithRelationInput;
  else orderBy = { createdAt: "desc" } as Prisma.ProductOrderByWithRelationInput;

  const total = await prisma.product.count({ where });
  const products = await prisma.product.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      orders: { select: { amount: true, status: true } }
    },
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  const enrichedProducts = products.map((product) => {
    const paidOrders = product.orders.filter((order) => order.status === "PAID" || order.status === "VERIFIED");
    const orderCount = product.orders.length;
    const paidOrderCount = paidOrders.length;
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.amount), 0);

    return {
      ...product,
      orders: undefined,
      metrics: {
        orderCount,
        paidOrderCount,
        revenue,
        conversionRate: orderCount ? Math.round((paidOrderCount / orderCount) * 100) : 0
      }
    };
  });

  return apiOk({ data: enrichedProducts, meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  try {
    await requireOrgAccess(session.user.id, session.user.organizationId, TeamRole.MANAGER);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const parsed = createProductSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, organizationId: session.user.organizationId, deletedAt: null }
  });

  if (!project) return apiError("not_found", "Project not found.", 404);

  const product = await createProduct(parsed.data);
  return apiOk(product, { status: 201 });
}
