"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import apiFetch from "@/lib/api/client";
import { Camera, Save, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/lib/uploadthing";

type Profile = { name?: string; company?: string; bio?: string; image?: string; email?: string } | null;

export default function GeneralProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(null);
  const [form, setForm] = useState({ name: "", company: "", bio: "", image: "" });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const payload = (await apiFetch("/api/dashboard/profile")) as Profile;
        setProfile(payload);
        setForm({
          name: payload?.name ?? "",
          company: payload?.company ?? "",
          bio: payload?.bio ?? "",
          image: payload?.image ?? ""
        });
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const payload = (await apiFetch("/api/dashboard/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })) as Profile;
      setProfile(payload);
      setMessage("Profile updated");
    } catch (e) {
      setMessage("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !profile) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="h-72 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]" />
        <div className="h-72 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]" />
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
        <FormLabel label="Full name">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </FormLabel>
        <FormLabel label="Company">
          <Input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
        </FormLabel>
        <FormLabel label="Bio">
          <textarea
            className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-primary"
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />
        </FormLabel>
        <div className="flex items-center gap-3">
          <Button className="gap-2" onClick={save} disabled={loading}>
            <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save profile"}
          </Button>
          {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
        </div>
      </div>

      <div className="space-y-5 rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Account email</p>
          <p className="mt-2 truncate text-sm font-medium text-white">{profile?.email ?? "-"}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Profile photo</p>
          <div className="mt-3 flex items-center gap-4">
            {form.image ? (
              <Image src={form.image} alt="avatar" width={96} height={96} className="h-24 w-24 rounded-2xl border border-white/10 object-cover" unoptimized />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-500">
                <UserRound className="h-8 w-8" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-400">Upload a square image for the workspace shell and account menus.</p>
            </div>
          </div>
          <div className="mt-4">
            <UploadButton
              endpoint="projectLogo"
              onClientUploadComplete={(res) => {
                const url = res[0]?.url;
                if (url) setForm((current) => ({ ...current, image: url }));
              }}
              appearance={{ button: "bg-white text-black text-sm px-4 py-2 rounded-xl", allowedContent: "text-zinc-500 text-xs" }}
              content={{ button: <span className="inline-flex items-center gap-2"><Camera className="h-4 w-4" /> Upload photo</span> }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
