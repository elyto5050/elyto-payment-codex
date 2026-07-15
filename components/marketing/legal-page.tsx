import { getPlatformContent, DEFAULT_LEGAL_CONTENT } from "@/lib/services/platform-content";

export async function LegalPageContent({ slug }: { slug: keyof typeof DEFAULT_LEGAL_CONTENT }) {
  const content = await getPlatformContent(slug);
  const fallback = DEFAULT_LEGAL_CONTENT[slug];
  const title = content?.title ?? fallback.title;
  const body = content?.content ?? fallback.content;

  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">{title}</h1>
      <article className="prose prose-invert mt-8 max-w-none whitespace-pre-wrap text-sm leading-7 text-zinc-300">
        {body}
      </article>
    </main>
  );
}
