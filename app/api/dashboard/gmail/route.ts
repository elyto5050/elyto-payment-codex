import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  // Return all Gmail connections for the organization so the UI can surface
  // connections that may be in an ERROR state (e.g. transient sync failures).
  // A missing ACTIVE connection previously caused the UI to hide the account
  // when a background sync recorded an ERROR; returning all rows avoids that.
  const connections = await prisma.gmailConnection.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" }
  });

  // Add a convenience `connected` boolean for clients expecting a simple flag
  const payload = connections.map((c) => ({
    id: c.id,
    googleEmail: c.googleEmail,
    scope: c.scope,
    status: c.status,
    lastSyncAt: c.lastSyncAt,
    lastError: c.lastError,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    connected: c.status !== "DISCONNECTED"
  }));

  return apiOk(payload);
}
