import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { getOrganizationAnalytics } from "@/lib/services/analytics";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const analytics = await getOrganizationAnalytics(session.user.organizationId);
  return apiOk(analytics);
}
