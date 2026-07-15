import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function createProduct(input: {
  projectId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  planType?: "MONTHLY" | "QUARTERLY" | "YEARLY" | "LIFETIME";
}) {
  return prisma.product.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency ?? "INR",
      category: input.category,
      planType: input.planType,
      status: ProductStatus.ACTIVE
    }
  });
}

export async function listProducts(projectId: string) {
  return prisma.product.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });
}

export async function listOrganizationProducts(organizationId: string) {
  return prisma.product.findMany({
    where: { project: { organizationId, deletedAt: null }, deletedAt: null },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateProduct(productId: string, projectId: string, data: Partial<{
  name: string;
  description: string;
  price: number;
  category: string;
  planType: "MONTHLY" | "QUARTERLY" | "YEARLY" | "LIFETIME";
  status: ProductStatus;
}>) {
  const product = await prisma.product.findFirst({ where: { id: productId, projectId } });
  if (!product) throw new Error("Product not found.");
  return prisma.product.update({
    where: { id: product.id },
    data
  });
}

export async function deleteProduct(productId: string, projectId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, projectId } });
  if (!product) throw new Error("Product not found.");
  return prisma.product.update({
    where: { id: product.id },
    data: { deletedAt: new Date(), status: ProductStatus.ARCHIVED }
  });
}
