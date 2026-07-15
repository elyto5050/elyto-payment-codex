import { slugify } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export type Tutorial = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  live?: boolean;
  viewerCount?: number;
  duration?: string;
  author?: string;
  createdAt: string;
  keywords?: string[]; // admin-only
  published?: boolean;
  displayOrder?: number;
  createdBy?: string;
};

function mapPrisma(t: any, admin = false) {
  if (!t) return null;
  const base: any = {
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description ?? undefined,
    youtubeUrl: t.youtubeUrl,
    thumbnailUrl: t.thumbnail ?? undefined,
    category: t.category ?? undefined,
    displayOrder: t.displayOrder ?? undefined,
    published: t.published,
    live: !!t.live,
    viewerCount: typeof t.viewerCount === 'number' ? t.viewerCount : undefined,
    createdAt: t.createdAt?.toISOString(),
    updatedAt: t.updatedAt?.toISOString(),
    createdBy: t.createdBy
  };
  if (admin) base.keywords = t.keywords ?? [];
  return base as Tutorial;
}

export async function listTutorials(opts?: { page?: number; pageSize?: number; search?: string; category?: string; admin?: boolean }) {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 25;
  const search = opts?.search?.trim() || undefined;
  const category = opts?.category ?? undefined;
  const admin = !!opts?.admin;

  try {
    const where: any = {};
    if (!admin) {
      where.published = true;
      // Only surface tutorials created by platform admins in the public API
      where.creator = { platformRole: 'ADMIN' };
    }
    if (category) where.category = category as any;
    if (search) {
      where.AND = [{ OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ] }];
      // Include keywords search (exact token match) for all contexts
      where.AND[0].OR.push({ keywords: { has: search } });
    }

    const total = await prisma.tutorial.count({ where });
    const rows = await prisma.tutorial.findMany({ where, orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize });
    let data = rows.map((r) => mapPrisma(r, admin));

    if (!admin) {
      // Ensure only a single tutorial is marked live in public responses.
      const liveItems = data.filter((d) => !!d?.live);
      if (liveItems.length > 1) {
        // Pick the most recently created live tutorial as the single live item.
        let latest = liveItems[0];
        for (const it of liveItems) {
          if (new Date(it.createdAt) > new Date(latest.createdAt)) latest = it;
        }
        data = data.map((d) => ({ ...d, live: d.id === latest.id }));
      }

      // strip keywords (admin-only)
      return { data, total };
    }

    return { data, total };
  } catch (err) {
    // On DB errors, do not render hardcoded data. Return empty result.
    return { data: [], total: 0 };
  }
}

export async function getTutorialBySlug(slug: string, admin = false) {
  try {
    const t = await prisma.tutorial.findUnique({ where: { slug }, include: { creator: { select: { platformRole: true } } } });
    if (!t) return null;
    if (!admin && !t.published) return null;
    if (!admin && t.creator?.platformRole !== 'ADMIN') return null;
    return mapPrisma(t, admin);
  } catch (err) {
    return null;
  }
}

export async function getTutorialById(id: string, admin = false) {
  try {
    const t = await prisma.tutorial.findUnique({ where: { id }, include: { creator: { select: { platformRole: true } } } });
    if (!t) return null;
    if (!admin && !t.published) return null;
    if (!admin && t.creator?.platformRole !== 'ADMIN') return null;
    return mapPrisma(t, admin);
  } catch (err) {
    return null;
  }
}

export async function createTutorial(input: Partial<Tutorial> & { title: string; createdBy?: string }) {
  const slug = input.slug ?? slugify(input.title);
  try {
    // If this tutorial is being created as live, ensure we unset other live flags.
    if (input.live) {
      await prisma.tutorial.updateMany({ where: { live: true }, data: { live: false } });
    }

    const created = await prisma.tutorial.create({
      data: {
        slug,
        title: input.title,
        description: input.description ?? undefined,
        youtubeUrl: input.youtubeUrl ?? "",
        thumbnail: (input.thumbnailUrl as string) ?? undefined,
        // Prisma category is an enum; provide a safe default if not supplied
        category: (input.category as any) ?? "GETTING_STARTED",
        live: !!input.live,
        viewerCount: input.viewerCount ?? undefined,
        keywords: input.keywords ?? [],
        published: !!input.published,
        displayOrder: input.displayOrder ?? 9999,
        createdBy: input.createdBy ?? ""
      }
    });

    return mapPrisma(created, true);
  } catch (err) {
    // Propagate DB error to caller; do not create local dummy data.
    throw err;
  }
}

export async function updateTutorial(id: string, updates: Partial<Tutorial>) {
  try {
    // If marking this tutorial live, clear other live flags first to ensure only one live tutorial exists.
    if (typeof updates.live === 'boolean' && updates.live) {
      await prisma.tutorial.updateMany({ where: { NOT: { id }, live: true }, data: { live: false } });
    }

    const updated = await prisma.tutorial.update({ where: { id }, data: {
      title: updates.title ?? undefined,
      description: updates.description ?? undefined,
      youtubeUrl: updates.youtubeUrl ?? undefined,
      thumbnail: (updates.thumbnailUrl as string) ?? undefined,
      category: (updates.category as any) ?? undefined,
      live: typeof updates.live === 'boolean' ? updates.live : undefined,
      viewerCount: typeof updates.viewerCount === 'number' ? updates.viewerCount : undefined,
      keywords: updates.keywords ?? undefined,
      published: typeof updates.published === "boolean" ? updates.published : undefined,
      displayOrder: updates.displayOrder ?? undefined
    } });

    return mapPrisma(updated, true);
  } catch (err) {
    throw err;
  }
}

export async function deleteTutorial(id: string) {
  try {
    await prisma.tutorial.delete({ where: { id } });
    return true;
  } catch (err) {
    throw err;
  }
}
