"use client";

import { useState } from "react";
import apiFetch from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TutorialForm({ initial, onSaved }: { initial?: any; onSaved?: (t: any) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(", ") as string);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [published, setPublished] = useState<boolean>(initial?.published ?? false);
  const [live, setLive] = useState<boolean>(initial?.live ?? false);
  const [publishing, setPublishing] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setPublishing(true);
    try {
      const payload: any = { title, description, youtubeUrl, thumbnailUrl, category };
      if (keywords && keywords.trim()) payload.keywords = keywords.split(",").map((k) => k.trim()).filter(Boolean);
      payload.published = !!published;
      payload.live = !!live;
      if (initial?.id) {
        const res = await apiFetch(`/api/admin/tutorials/${initial.id}`, { method: "PATCH", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
        if (onSaved) onSaved(res);
      } else {
        const res = await apiFetch("/api/admin/tutorials", { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
        if (onSaved) onSaved(res);
      }
    } catch (err) {
      // ignore for now
    } finally {
      setPublishing(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-xs text-zinc-400">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="text-xs text-zinc-400">Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className="text-xs text-zinc-400">YouTube URL</label>
        <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
      </div>

      <div>
        <label className="text-xs text-zinc-400">Thumbnail URL</label>
        <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
      </div>

      <div>
        <label className="text-xs text-zinc-400">Category</label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>

      <div>
        <label className="text-xs text-zinc-400">Keywords (comma separated)</label>
        <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
      </div>

      <div className="flex items-center gap-2">
        <input id="published" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        <label htmlFor="published" className="text-xs text-zinc-400">Published</label>
      </div>

      <div className="flex items-center gap-2">
        <input id="live" type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
        <label htmlFor="live" className="text-xs text-zinc-400">Live Stream</label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={publishing}>{publishing ? "Saving..." : "Create Tutorial"}</Button>
      </div>
    </form>
  );
}
