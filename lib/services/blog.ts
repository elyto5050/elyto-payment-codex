import { prisma } from "@/lib/db/prisma";

export async function listPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true }
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, published: true }
  });
}

export async function listAllPosts() {
  return prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
}

export async function listPosts(page = 1, pageSize = 25, search?: string) {
  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } }
    ];
  }

  const total = await prisma.blogPost.count({ where });
  const posts = await prisma.blogPost.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });
  return { data: posts, total };
}

export async function upsertPost(input: {
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  published?: boolean;
  authorId?: string;
}) {
  const publishedAt = input.published ? new Date() : null;
  return prisma.blogPost.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      published: input.published ?? false,
      publishedAt,
      authorId: input.authorId
    },
    update: {
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      published: input.published,
      publishedAt: input.published ? publishedAt ?? new Date() : null
    }
  });
}

export async function deletePost(slug: string) {
  return prisma.blogPost.delete({ where: { slug } });
}
