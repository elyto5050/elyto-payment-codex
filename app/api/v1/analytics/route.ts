import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { authenticateApiKey, getClientIp } from "@/lib/api/middleware";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getOrganizationAnalytics } from "@/lib/services/analytics";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(`analytics:${getClientIp(request)}`, 60);
  if (!rateLimit.allowed) return apiError("rate_limited", "Too many requests.", 429);

  const apiKey = await authenticateApiKey(request);
  if (!apiKey) return apiError("unauthorized", "A valid Elyto secret key is required.", 401);

  const analytics = await getOrganizationAnalytics(apiKey.organizationId);
  return apiOk(analytics.summary);
}
