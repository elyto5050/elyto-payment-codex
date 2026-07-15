import { NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, apiError } from "@/lib/api/response";
import { requirePlatformAdmin } from "@/lib/api/admin";
import { getSocialLinks, upsertSocialLinks } from "@/lib/services/social-links";

const schema = z.object({
  instagramUrl: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  discordInviteUrl: z.string().url().optional().or(z.literal(''))
});

export async function GET(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return apiError("forbidden", "Admin access required.", 403);

  try {
    const links = await getSocialLinks();
    return apiOk(links ?? {});
  } catch (err: any) {
    return apiError("server_error", err?.message ?? "Failed to read social links.", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return apiError("forbidden", "Admin access required.", 403);

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);

  try {
    const updated = await upsertSocialLinks({ ...parsed.data, updatedById: admin.user.id });
    return apiOk(updated);
  } catch (err: any) {
    return apiError("server_error", err?.message ?? "Failed to update social links.", 500);
  }
}
