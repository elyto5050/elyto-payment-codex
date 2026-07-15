import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { disableMfa, enableMfa, generateMfaSecret, getMfaUri, verifyTotpCode } from "@/lib/services/mfa";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user?.id || !session.user.email) return apiError("unauthorized", "Sign in required.", 401);

  const { getMfaStatus } = await import("@/lib/services/mfa");
  const status = await getMfaStatus(session.user.id);
  if (status.enabled) return apiOk({ enabled: true });

  const secret = generateMfaSecret();
  const uri = getMfaUri(session.user.email, secret);
  return apiOk({ secret, uri, enabled: false });
}

const enableSchema = z.object({ secret: z.string().min(1), code: z.string().length(6) });
const disableSchema = z.object({ code: z.string().length(6) });

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user?.id) return apiError("unauthorized", "Sign in required.", 401);

  const body = await request.json();

  if (body.action === "enable") {
    const parsed = enableSchema.safeParse(body);
    if (!parsed.success) return apiError("invalid_request", "Invalid request.", 422);
    if (!verifyTotpCode(parsed.data.secret, parsed.data.code)) {
      return apiError("invalid_code", "Invalid verification code.", 422);
    }
    await enableMfa(session.user.id, parsed.data.secret);
    await prisma.securityEvent.create({
      data: { userId: session.user.id, type: "mfa.enabled", severity: "INFO" }
    });
    return apiOk({ enabled: true });
  }

  if (body.action === "disable") {
    const parsed = disableSchema.safeParse(body);
    if (!parsed.success) return apiError("invalid_request", "Invalid request.", 422);
    const { verifyUserMfa } = await import("@/lib/services/mfa");
    if (!(await verifyUserMfa(session.user.id, parsed.data.code))) {
      return apiError("invalid_code", "Invalid verification code.", 422);
    }
    await disableMfa(session.user.id);
    return apiOk({ enabled: false });
  }

  return apiError("invalid_request", "Unknown action.", 422);
}
