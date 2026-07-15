import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { acceptTeamInvite } from "@/lib/services/team";
import { z } from "zod";

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.user?.email) return apiError("unauthorized", "Sign in required.", 401);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Invalid request.", 422);

  try {
    await acceptTeamInvite(parsed.data.token, session.user.id, session.user.email);
    return apiOk({ success: true });
  } catch (error) {
    return apiError("invalid_invite", error instanceof Error ? error.message : "Invalid invite.", 422);
  }
}
