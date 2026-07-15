import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { getMfaStatus } from "@/lib/services/mfa";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user?.id) return apiError("unauthorized", "Sign in required.", 401);

  const [loginHistory, securityEvents, mfa] = await Promise.all([
    prisma.loginHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.securityEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    getMfaStatus(session.user.id)
  ]);

  return apiOk({ loginHistory, securityEvents, mfa });
}
