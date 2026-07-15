import { notFound } from "next/navigation";
import { getTutorialBySlug } from "@/lib/services/tutorials";

export const dynamic = "force-dynamic";

function extractYouTubeId(url?: string) {
  if (!url) return null;
  const m = url.match(/(?:v=|be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default async function TutorialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tutorial = await getTutorialBySlug(slug, false as any);
  if (!tutorial) notFound();

  const videoId = extractYouTubeId((tutorial as any).youtubeUrl);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <a href="/tutorials" className="text-sm text-secondary hover:underline">← Back to tutorials</a>
      <h1 className="mt-6 text-4xl font-semibold text-white">{(tutorial as any).title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{(tutorial as any).category} • {(tutorial as any).duration ?? ""}</p>

      <div className="mt-8">
        {videoId ? (
          <div className="relative aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&controls=1&autoplay=0&modestbranding=1`}
              title={(tutorial as any).title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="w-full h-full rounded-md"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="rounded-md bg-white/5 p-6">No video available</div>
        )}
      </div>

      <article className="prose prose-invert mt-8 max-w-none whitespace-pre-wrap text-sm leading-7 text-zinc-300">
        {(tutorial as any).description}
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: (tutorial as any).title,
        description: (tutorial as any).description,
        thumbnailUrl: (tutorial as any).thumbnailUrl || undefined,
        uploadDate: (tutorial as any).createdAt || undefined,
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : undefined
      }) }} />
    </main>
  );
}
