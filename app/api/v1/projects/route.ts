import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { authenticateApiKey, getClientIp } from "@/lib/api/middleware";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createProjectSchema } from "@/lib/validators/projects";
import { createProject } from "@/lib/services/projects";

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(`projects:${getClientIp(request)}`, 60);
  if (!rateLimit.allowed) {
    return apiError("rate_limited", "Too many requests.", 429);
  }

  const apiKey = await authenticateApiKey(request);
  if (!apiKey) {
    return apiError("unauthorized", "A valid Elyto secret key is required.", 401);
  }

  const parsed = createProjectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);
  }

  const { project, secretKey } = await createProject({
    organizationId: apiKey.organizationId,
    ...parsed.data
  });

  return apiOk({ id: project.id, name: project.name, secretKey }, { status: 201 });
}
