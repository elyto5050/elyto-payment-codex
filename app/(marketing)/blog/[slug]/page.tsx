import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/services/blog";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post = null;
  try {
    post = await getPostBySlug(slug);
  } catch {
    post = null;
  }

  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/blog" className="text-sm text-secondary hover:underline">← Back to blog</Link>
      <h1 className="mt-6 text-4xl font-semibold text-white">{post.title}</h1>
      <time className="mt-2 block text-sm text-zinc-500">
        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
      </time>
      <article className="prose prose-invert mt-8 max-w-none whitespace-pre-wrap text-sm leading-7 text-zinc-300">
        {post.content}
      </article>
    </main>
  );
}
