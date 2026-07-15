"use client";

import { useState, useEffect } from "react";

export default function SocialSettingsForm() {
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [discordInviteUrl, setDiscordInviteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/admin/settings/social');
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json || {};
          setInstagramUrl(data.instagramUrl || "");
          setYoutubeUrl(data.youtubeUrl || "");
          setDiscordInviteUrl(data.discordInviteUrl || "");
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleSave(e: any) {
    e?.preventDefault?.();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagramUrl: instagramUrl || '', youtubeUrl: youtubeUrl || '', discordInviteUrl: discordInviteUrl || '' })
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      // ignore
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <form className="space-y-4 max-w-3xl" onSubmit={handleSave}>
      <div>
        <label className="block text-sm text-zinc-300">Instagram URL</label>
        <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/yourhandle" className="mt-1 w-full rounded-lg bg-white/3 border border-white/6 px-3 py-3 text-white" />
      </div>

      <div>
        <label className="block text-sm text-zinc-300">YouTube URL</label>
        <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/channel/.." className="mt-1 w-full rounded-lg bg-white/3 border border-white/6 px-3 py-3 text-white" />
      </div>

      <div>
        <label className="block text-sm text-zinc-300">Discord Invite URL</label>
        <input value={discordInviteUrl} onChange={(e) => setDiscordInviteUrl(e.target.value)} placeholder="https://discord.gg/your-invite" className="mt-1 w-full rounded-lg bg-white/3 border border-white/6 px-3 py-3 text-white" />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving || loading} className="rounded-full px-4 py-2 bg-cyan-500 text-black font-semibold hover:brightness-105 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        {saved && <div className="text-sm text-emerald-400">Saved</div>}
      </div>
    </form>
  );
}
