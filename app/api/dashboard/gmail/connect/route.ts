import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/api/middleware";
import { createOAuthState, getGmailAuthUrl } from "@/lib/gmail/oauth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) {
    redirect("/login");
  }

  // Enforce single Gmail connection per organization
  const existingCount = await prisma.gmailConnection.count({ where: { organizationId: session.user.organizationId, status: { not: "DISCONNECTED" } } });
  if (existingCount >= 1) {
    logger.info("Gmail connect blocked: maximum connections reached", { userId: session.user.id, organizationId: session.user.organizationId });
    redirect("/dashboard/gmail?error=max_reached");
  }

  const state = createOAuthState(session.user.id, session.user.organizationId);
  logger.info("Gmail connect initiated", { userId: session.user.id, organizationId: session.user.organizationId });
  redirect(getGmailAuthUrl(state));
}
