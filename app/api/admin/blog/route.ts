import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requirePlatformAdmin } from "@/lib/api/admin";
import { deletePost, listPosts, upsertPost } from "@/lib/services/blog";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return apiError("forbidden", "Admin access required.", 403);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? "25")));
  const search = url.searchParams.get("search") || undefined;

  const { data, total } = await listPosts(page, pageSize, search);
  const meta = { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  return apiOk({ data, meta });
}

const schema = z.object({
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  published: z.boolean().optional(),
  slug: z.string().optional()
});

export async function POST(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return apiError("forbidden", "Admin access required.", 403);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Invalid request.", 422);

  const slug = parsed.data.slug ?? slugify(parsed.data.title);
  const post = await upsertPost({
    slug,
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    published: parsed.data.published,
    authorId: admin.user.id
  });

  return apiOk(post, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return apiError("forbidden", "Admin access required.", 403);

  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return apiError("invalid_request", "slug required.", 422);

  await deletePost(slug);
  return apiOk({ success: true });
}
