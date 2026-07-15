import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requirePlatformAdmin } from "@/lib/api/admin";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/service";
import { listTutorials, createTutorial } from "@/lib/services/tutorials";
import { slugify } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  youtubeUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  category: z.string().optional(),
  duration: z.string().optional(),
  live: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  displayOrder: z.number().optional(),
  slug: z.string().optional()
});

async function ensureAdminOrPermission() {
  const admin = await requirePlatformAdmin();
  if (admin) return { type: "admin", user: admin.user };

  const session = await auth();
  if (!session?.user?.id) return null;
  const allowed = await hasPermission(session.user.id, "content:manage-tutorials" as any);
  if (!allowed) return null;
  return { type: "staff", user: { id: session.user.id } };
}

export async function GET(request: NextRequest) {
  const adminOrStaff = await ensureAdminOrPermission();
  if (!adminOrStaff) return apiError("forbidden", "Admin access required.", 403);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? "25")));
  const search = url.searchParams.get("search") || undefined;
  const category = url.searchParams.get("category") || undefined;

  const { data, total } = await listTutorials({ page, pageSize, search, category, admin: true });
  const meta = { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  return apiOk({ data, meta });
}

export async function POST(request: NextRequest) {
  const allowed = await ensureAdminOrPermission();
  if (!allowed) return apiError("forbidden", "Admin access required.", 403);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);

  const slug = parsed.data.slug ?? slugify(parsed.data.title);
  try {
    const created = await createTutorial({ ...parsed.data, slug, createdBy: (allowed.user as any).id } as any);
    return apiOk(created, { status: 201 });
  } catch (err: any) {
    return apiError("server_error", err?.message ?? "Failed to create tutorial.", 500);
  }
}
