import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Token required.", 422);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const result = await verifyTurnstileToken(parsed.data.token, ip);

  if (!result.success && !result.skipped) {
    return apiError("turnstile_failed", "Verification failed.", 403);
  }

  return apiOk({ verified: true });
}
