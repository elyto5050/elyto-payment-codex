"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function TutorialCard({ tutorial }: { tutorial: any }) {
  return (
    <motion.article whileHover={{ y: -8 }} className="rounded-2xl bg-white/3 backdrop-blur p-0 border border-white/8 overflow-hidden transition-shadow shadow-none hover:shadow-[0_8px_30px_rgba(6,182,212,0.08)]">
      <Link href={`/tutorials/${tutorial.slug}`} className="block">
        <div className="relative w-full">
          {tutorial.thumbnailUrl || tutorial.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tutorial.thumbnailUrl ?? tutorial.thumbnail} alt={tutorial.title} className="w-full aspect-video object-cover" />
          ) : (
            <div className="w-full aspect-video bg-white/5" />
          )}

          {tutorial.live && tutorial.published && (
            <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-2 py-1 text-xs">
              <span className="text-red-500">●</span>
              <span className="text-xs text-white">LIVE</span>
            </div>
          )}

          {tutorial.duration && (
            <div className="absolute right-3 bottom-3 rounded-md bg-black/60 px-2 py-1 text-xs text-zinc-200">{tutorial.duration}</div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-white leading-tight">{tutorial.title}</h3>
          <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{tutorial.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-zinc-400">{tutorial.category}</div>
            <div>
              <span className="inline-flex items-center rounded-full bg-cyan-500 px-3 py-1 text-black text-sm font-medium">Watch</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
