"use client";

import { useEffect, useState, useMemo } from "react";
import apiFetch from "@/lib/api/client";
import TutorialCard from "@/components/tutorials/tutorial-card";
import { motion } from "framer-motion";

function extractYouTubeId(url?: string) {
  if (!url) return null;
  const m = url.match(/(?:v=|be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function TutorialsClient() {
  const [tutorials, setTutorials] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/tutorials');
        if (!mounted) return;
        setTutorials(Array.isArray(res) ? res : (res?.data ?? []));
      } catch (err) {
        setTutorials([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();

    // no inline social fetch here — global footer fetches social links dynamically
    return () => { mounted = false; };
  }, []);

  const live = (tutorials || []).find((t: any) => t.live && t.published) ?? null;
  const pastAll = (tutorials || []).filter((t: any) => t.published && !t.live);

  const filteredPast = useMemo(() => {
    if (!query) return pastAll;
    const q = query.trim().toLowerCase();
    return pastAll.filter((t: any) => {
      const inTitle = (t.title || "").toLowerCase().includes(q);
      const inDesc = (t.description || "").toLowerCase().includes(q);
      const inKeywords = Array.isArray(t.keywords) && t.keywords.join(' ').toLowerCase().includes(q);
      return inTitle || inDesc || inKeywords;
    });
  }, [pastAll, query]);

  return (
    <div className="relative min-h-screen bg-[linear-gradient(#050505,#050505)] text-white">
      {/* Animated background blobs */}
      <motion.div initial={{ opacity: 0.2, scale: 0.8 }} animate={{ opacity: [0.2,0.35,0.2], scale: [0.8,1,0.8] }} transition={{ duration: 8 }} className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div style={{ width: 800, height: 600, filter: 'blur(80px)', background: 'radial-gradient(circle at 20% 30%, rgba(6,182,212,0.18), transparent 20%), radial-gradient(circle at 80% 70%, rgba(139,92,246,0.12), transparent 25%)' }} />
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <header className="max-w-4xl mx-auto text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold">Tutorials</h1>
          <p className="mt-3 text-zinc-400">Watch tutorials, setup guides and live streams from Elyto.</p>

          <div className="mt-6">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">🔎</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tutorials..." className="w-full h-14 pl-12 pr-4 rounded-full bg-white/3 border border-transparent focus:border-cyan-400 outline-none text-white placeholder:text-zinc-400" />
              </div>
            </div>
          </div>
        </header>

        {live ? (
          <section className="mb-12 flex justify-center">
            <div className="w-full max-w-[850px] rounded-2xl bg-white/3 backdrop-blur p-4 border border-white/6">
              <div className="w-full">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10">
                  {/* lazy iframe */}
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(live.youtubeUrl)}?rel=0&controls=1&autoplay=0&modestbranding=1`}
                    title={live.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="w-full h-full"
                    loading="lazy"
                  />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-sm">
                    <span className="text-red-500">🔴</span>
                    <span className="text-xs">LIVE</span>
                    {typeof live.viewerCount === 'number' && (<span className="ml-2 text-xs text-zinc-300">{live.viewerCount} viewers</span>)}
                  </div>
                </div>

                <h2 className="mt-4 text-2xl font-semibold">{live.title}</h2>
                <p className="mt-2 text-zinc-300">{live.description}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {loading ? (
              <div className="text-zinc-400">Loading tutorials...</div>
            ) : filteredPast.length ? (
              filteredPast.map((t: any) => (
                <motion.div key={t.id} className="transition-all">
                  <TutorialCard tutorial={t} />
                </motion.div>
              ))
            ) : (
              <div className="text-zinc-400">No tutorials available yet.</div>
            )}
          </div>
        </section>
        {/* Footer and social links are rendered by the global MarketingFooter */}
      </div>
    </div>
  );
}
