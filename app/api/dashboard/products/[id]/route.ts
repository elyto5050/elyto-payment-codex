import { NextRequest } from "next/server";
import { TeamRole } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api/response";
import { requireOrgAccess, requireSession } from "@/lib/api/middleware";
import { updateProductSchema } from "@/lib/validators/projects";
import { deleteProduct, updateProduct } from "@/lib/services/products";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  try {
    await requireOrgAccess(session.user.id, session.user.organizationId, TeamRole.MANAGER);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const { id } = await params;
  const parsed = updateProductSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);
  }

  const product = await prisma.product.findFirst({
    where: { id, project: { organizationId: session.user.organizationId } }
  });

  if (!product) return apiError("not_found", "Product not found.", 404);

  const updated = await updateProduct(id, product.projectId, parsed.data);
  return apiOk(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, project: { organizationId: session.user.organizationId } }
  });

  if (!product) return apiError("not_found", "Product not found.", 404);

  await deleteProduct(id, product.projectId);
  return apiOk({ success: true });
}
