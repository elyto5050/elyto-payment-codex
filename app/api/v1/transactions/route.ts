import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/api/response";
import { hashApiKey } from "@/lib/security/api-keys";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return apiError("unauthorized", "A valid Elyto secret key is required.", 401);
  }

  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(token) } });
  if (!apiKey || apiKey.revokedAt) {
    return apiError("unauthorized", "A valid Elyto secret key is required.", 401);
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      project: {
        organizationId: apiKey.organizationId
      }
    },
    orderBy: { receivedAt: "desc" },
    take: 50
  });

  return apiOk(transactions);
}
