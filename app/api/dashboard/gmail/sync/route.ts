import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { queues } from "@/lib/queues";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const connections = await prisma.gmailConnection.findMany({ where: { organizationId: session.user.organizationId } });
  if (!connections.length) return apiOk({ queued: 0, message: "no_connections" });

  if (!queues) {
    // In environments without Redis, return a hint to the client.
    logger.warn("Gmail sync requested but no queues configured", { organizationId: session.user.organizationId });
    return apiOk({ queued: 0, message: "no_queues" });
  }

  let queued = 0;
  for (const conn of connections) {
    try {
      await queues.gmailSync.add("sync", { gmailConnectionId: conn.id });
      queued += 1;
    } catch (err) {
      logger.warn("Failed to enqueue gmail sync job", { connectionId: conn.id, error: String(err) });
    }
  }

  logger.info("Manual Gmail sync requested", { organizationId: session.user.organizationId, queued });
  return apiOk({ queued });
}
