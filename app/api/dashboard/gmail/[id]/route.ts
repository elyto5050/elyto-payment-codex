import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

export async function DELETE(request: NextRequest, context: any) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const params = context?.params ?? {};
  const id = params.id;
  if (!id) return apiError("invalid_id", "Missing connection id.", 400);

  const connection = await prisma.gmailConnection.findUnique({ where: { id } });
  if (!connection || connection.organizationId !== session.user.organizationId) return apiError("not_found", "Gmail connection not found.", 404);

  try {
    // Safely remove references and delete the connection
    // 1) Nullify any Transaction.gmailConnectionId that reference this connection
    // 2) Delete the GmailConnection row (GmailSyncLog has cascade delete)
    await prisma.$transaction([
      prisma.transaction.updateMany({ where: { gmailConnectionId: id }, data: { gmailConnectionId: null } }),
      prisma.gmailConnection.delete({ where: { id } })
    ]);

    logger.info("Gmail disconnected", { connectionId: id, userId: session?.user?.id, organizationId: session.user.organizationId });

    return apiOk({ success: true, deleted: true });
  } catch (err) {
    return apiError("delete_failed", "Failed to disconnect Gmail account.", 500);
  }
}
