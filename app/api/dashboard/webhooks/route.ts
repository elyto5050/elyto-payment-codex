import { NextRequest } from "next/server";
import { TeamRole } from "@prisma/client";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/api/response";
import { requireOrgAccess, requireSession } from "@/lib/api/middleware";
import { encryptSecret } from "@/lib/security/crypto";

const createWebhookSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(120),
  url: z.string().url(),
  events: z.array(z.string()).default([])
});

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { project: { organizationId: session.user.organizationId, deletedAt: null } },
    include: { project: { select: { name: true } }, _count: { select: { deliveries: true } } },
    orderBy: { createdAt: "desc" }
  });

  return apiOk(webhooks);
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  try {
    await requireOrgAccess(session.user.id, session.user.organizationId, TeamRole.MANAGER);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const parsed = createWebhookSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, organizationId: session.user.organizationId, deletedAt: null }
  });

  if (!project) return apiError("not_found", "Project not found.", 404);

  const secret = crypto.randomBytes(32).toString("base64url");

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      url: parsed.data.url,
      secretHash: encryptSecret(secret),
      events: parsed.data.events
    }
  });

  return apiOk({ webhook, secret }, { status: 201 });
}
