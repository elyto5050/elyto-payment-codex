import Link from "next/link";
import { listPublishedPosts } from "@/lib/services/blog";

type BlogListItem = { slug: string; title: string; excerpt: string | null; publishedAt: Date | null };

const fallbackPosts: BlogListItem[] = [
  { slug: "introducing-elyto", title: "Introducing Elyto", excerpt: "Payment verification infrastructure for Indian businesses.", publishedAt: new Date("2026-06-01") }
];

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  let posts: BlogListItem[] = fallbackPosts;
  try {
    const dbPosts = await listPublishedPosts();
    if (dbPosts.length) posts = dbPosts;
  } catch {
    // use fallback
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">Blog</h1>
      <p className="mt-4 text-zinc-400">Updates, guides, and product news.</p>
      <div className="mt-10 space-y-6">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block rounded-lg border border-border bg-card p-6 hover:border-primary/40">
            <time className="text-xs text-zinc-500">
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
            </time>
            <h2 className="mt-2 text-xl font-medium text-white">{post.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
