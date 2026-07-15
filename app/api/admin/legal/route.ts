import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requirePlatformAdmin } from "@/lib/api/admin";
import { listPlatformContent, upsertPlatformContent, DEFAULT_LEGAL_CONTENT } from "@/lib/services/platform-content";

export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin) return apiError("forbidden", "Admin access required.", 403);

  const pages = await listPlatformContent();
  const slugs = Object.keys(DEFAULT_LEGAL_CONTENT);
  const merged = slugs.map((slug) => {
    const existing = pages.find((p) => p.slug === slug);
    const fallback = DEFAULT_LEGAL_CONTENT[slug as keyof typeof DEFAULT_LEGAL_CONTENT];
    return existing ?? { slug, title: fallback.title, content: fallback.content, id: slug, updatedAt: new Date(), createdAt: new Date(), updatedById: null };
  });

  return apiOk(merged);
}

const schema = z.object({
  slug: z.enum(["terms", "refund", "privacy"]),
  title: z.string().min(1),
  content: z.string().min(1)
});

export async function PUT(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return apiError("forbidden", "Admin access required.", 403);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Invalid request.", 422);

  const page = await upsertPlatformContent(parsed.data.slug, parsed.data.title, parsed.data.content, admin.user.id);
  return apiOk(page);
}
