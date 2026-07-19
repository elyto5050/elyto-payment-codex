import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { requirePlatformAdmin } from "@/lib/api/admin";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/service";
import { getTutorialById, updateTutorial, deleteTutorial } from "@/lib/services/tutorials";
import { prisma } from "@/lib/db/prisma";

const patchSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  youtubeUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  category: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  live: z.boolean().optional(),
  displayOrder: z.number().optional()
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const allowed = await ensureAdminOrPermission();
  if (!allowed) return apiError("forbidden", "Admin access required.", 403);

  const { id } = await params;
  const t = await getTutorialById(id, true);
  if (!t) return apiError("not_found", "Tutorial not found.", 404);
  return apiOk(t);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const allowed = await ensureAdminOrPermission();
  if (!allowed) return apiError("forbidden", "Admin access required.", 403);

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", parsed.error.issues[0]?.message ?? "Invalid request.", 422);

  const updated = await updateTutorial(id, parsed.data as any);
  if (!updated) return apiError("not_found", "Tutorial not found.", 404);
  return apiOk(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const allowed = await ensureAdminOrPermission();
  if (!allowed) return apiError("forbidden", "Admin access required.", 403);

  // If staff (marketing) and not platform admin, disallow deleting tutorials created by OWNER
  if ((allowed.type === "staff")) {
    try {
      const tut = await prisma.tutorial.findUnique({ where: { id }, select: { createdBy: true } });
      if (tut?.createdBy) {
        const creator = await prisma.user.findUnique({ where: { id: tut.createdBy }, select: { platformRole: true } });
        if (creator?.platformRole === "OWNER" as any) {
          return apiError("forbidden", "Cannot delete tutorials created by the platform owner.", 403);
        }
      }
    } catch (err) {
      // If DB access fails, fall through to deny for safety
      return apiError("forbidden", "Insufficient permissions.", 403);
    }
  }

  const ok = await deleteTutorial(id);
  if (!ok) return apiError("not_found", "Tutorial not found.", 404);
  return apiOk({ success: true });
}

