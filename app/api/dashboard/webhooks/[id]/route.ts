import { NextRequest } from "next/server";
import { TeamRole } from "@prisma/client";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/api/response";
import { requireOrgAccess, requireSession } from "@/lib/api/middleware";
import { encryptSecret } from "@/lib/security/crypto";

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  rotateSecret: z.boolean().optional()
});

export async function PATCH(request: NextRequest, context: any) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);
  const params = context?.params ?? {};
  const id = params.id;
  if (!id) return apiError("invalid_id", "Missing webhook id.", 400);

  try {
    await requireOrgAccess(session.user.id, session.user.organizationId, TeamRole.MANAGER);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id }, include: { project: { select: { organizationId: true } } } });
  if (!endpoint || endpoint.project.organizationId !== session.user.organizationId) return apiError("not_found", "Webhook endpoint not found.", 404);

  const parsed = updateWebhookSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);

  const data: any = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.url !== undefined) data.url = parsed.data.url;
  if (parsed.data.events !== undefined) data.events = parsed.data.events;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;

  try {
    let secret: string | undefined;
    if (parsed.data.rotateSecret) {
      secret = crypto.randomBytes(32).toString("base64url");
      data.secretHash = encryptSecret(secret);
    }

    const updated = await prisma.webhookEndpoint.update({ where: { id }, data });

    return apiOk({ webhook: updated, secret });
  } catch (err) {
    return apiError("update_failed", "Failed to update webhook endpoint.", 500);
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);
  const params = context?.params ?? {};
  const id = params.id;
  if (!id) return apiError("invalid_id", "Missing webhook id.", 400);

  try {
    await requireOrgAccess(session.user.id, session.user.organizationId, TeamRole.MANAGER);
  } catch {
    return apiError("forbidden", "Insufficient permissions.", 403);
  }

  const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id }, include: { project: { select: { organizationId: true } } } });
  if (!endpoint || endpoint.project.organizationId !== session.user.organizationId) return apiError("not_found", "Webhook endpoint not found.", 404);

  try {
    // Soft-delete: mark disabledAt and status so deliveries stop but record remains
    await prisma.webhookEndpoint.update({ where: { id }, data: { disabledAt: new Date(), status: "DISABLED" } });
    return apiOk({ success: true });
  } catch (err) {
    return apiError("delete_failed", "Failed to delete webhook endpoint.", 500);
  }
}
