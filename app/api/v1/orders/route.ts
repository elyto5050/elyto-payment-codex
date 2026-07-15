import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/api/response";
import { authenticateApiKey, getClientIp } from "@/lib/api/middleware";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createOrderSchema } from "@/lib/validators/orders";
import { createOrder } from "@/lib/services/orders";

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(`orders:${getClientIp(request)}`, 120);
  if (!rateLimit.allowed) {
    return apiError("rate_limited", "Too many requests.", 429);
  }

  const apiKey = await authenticateApiKey(request);
  if (!apiKey) {
    return apiError("unauthorized", "A valid Elyto secret key is required.", 401);
  }

  const parsed = createOrderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);
  }

  const project = await prisma.project.findFirst({
    where: {
      id: parsed.data.projectId,
      organizationId: apiKey.organizationId,
      deletedAt: null
    }
  });

  if (!project) {
    return apiError("project_not_found", "Project could not be found for this API key.", 404);
  }

  const order = await createOrder({ ...parsed.data, organizationId: apiKey.organizationId });
  return apiOk({
    id: order.publicId,
    status: order.status,
    checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pay/${order.publicId}`
  }, { status: 201 });
}
