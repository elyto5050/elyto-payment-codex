"use client";

import { useEffect, useMemo, useState } from "react";
import apiFetch from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, History, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, DashboardCard } from "@/components/dashboard/card-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LegalPage = {
  id: string;
  slug: "terms" | "refund" | "privacy";
  title: string;
  content: string;
  updatedAt?: string;
};

const pageMeta: Record<LegalPage["slug"], { label: string; tone: string; description: string }> = {
  terms: {
    label: "Terms",
    tone: "from-violet-500/20 to-cyan-500/10",
    description: "Commercial rules, acceptable use, ownership, and platform obligations."
  },
  refund: {
    label: "Refund",
    tone: "from-amber-500/20 to-violet-500/10",
    description: "Merchant and buyer refund language for checkout and support flows."
  },
  privacy: {
    label: "Privacy",
    tone: "from-emerald-500/20 to-cyan-500/10",
    description: "Data collection, processing, retention, and user rights language."
  }
};

export default function AdminLegalPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<LegalPage["slug"]>("terms");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: pages = [], isLoading } = useQuery<LegalPage[]>({
    queryKey: ["admin-legal"],
    queryFn: async () => (await apiFetch("/api/admin/legal")) as LegalPage[]
  });

  useEffect(() => {
    const page = pages.find((item) => item.slug === selected);
    if (page) {
      setTitle(page.title);
      setContent(page.content);
    }
  }, [pages, selected]);

  const selectedPage = pages.find((item) => item.slug === selected);
  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const paragraphCount = useMemo(() => content.split(/\n\s*\n/).filter((block) => block.trim()).length, [content]);
  const dirty = Boolean(selectedPage && (selectedPage.title !== title || selectedPage.content !== content));

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/admin/legal", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: selected, title, content }) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-legal"] })
  });

  return (
    <div className="space-y-6">
      <DashboardHeader title="Legal Control Center" description="Manage public policy pages without changing routes, checkout flows, or API contracts." />

      <DashboardGrid columns={3}>
        {(["terms", "refund", "privacy"] as LegalPage["slug"][]).map((slug) => {
          const page = pages.find((item) => item.slug === slug);
          const active = selected === slug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setSelected(slug)}
              className={`rounded-dense border p-3 text-left text-xs transition-all ${
                active ? "border-cyan-400/30 bg-white/[0.05]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className="mb-2 h-1 rounded-full bg-gradient-to-r from-white/20 to-transparent" />
              <p className="font-medium text-white">{pageMeta[slug].label}</p>
              <p className="mt-1 text-[11px] leading-4 text-zinc-500">{pageMeta[slug].description}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600">
                <span>{page?.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "Default"}</span>
                <span>{active ? "Editing" : "Open"}</span>
              </div>
            </button>
          );
        })}
      </DashboardGrid>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <DashboardCard title={`${pageMeta[selected].label} policy`} subtitle="Editor">
          <div className="space-y-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-7 text-xs" />
            <textarea
              className="min-h-[300px] w-full resize-y rounded-dense border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs leading-5 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-300/50"
              placeholder={isLoading ? "Loading..." : "Write policy content..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button 
              className="w-full h-7 text-xs rounded-dense"
              onClick={() => saveMutation.mutate()} 
              disabled={!title || !content || saveMutation.isPending || !dirty}
            >
              <Save className="mr-2 h-3 w-3" />
              {saveMutation.isPending ? "Saving..." : dirty ? "Save" : "Saved"}
            </Button>
          </div>
        </DashboardCard>

        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <DashboardCard title="Health">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Status</span>
                {dirty ? <AlertTriangle className="h-4 w-4 text-amber-300" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-dense border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-[10px] text-zinc-500">Words</p>
                  <p className="text-sm font-semibold text-white">{wordCount.toLocaleString()}</p>
                </div>
                <div className="rounded-dense border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-[10px] text-zinc-500">Sections</p>
                  <p className="text-sm font-semibold text-white">{paragraphCount}</p>
                </div>
                <div className="rounded-dense border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-[10px] text-zinc-500">Status</p>
                  <p className="text-sm font-semibold text-white">{dirty ? "Draft" : "Live"}</p>
                </div>
                <div className="rounded-dense border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-[10px] text-zinc-500">Route</p>
                  <p className="text-sm font-semibold text-white">/{selected}</p>
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Guardrails">
            <div className="space-y-2 text-[10px] text-zinc-400">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Only admins can edit
              </p>
              <p className="flex items-center gap-2">
                <LockKeyhole className="h-3 w-3 text-zinc-500" />
                Routes untouched
              </p>
              <p className="flex items-center gap-2">
                <History className="h-3 w-3 text-zinc-500" />
                Updates auto-saved
              </p>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
