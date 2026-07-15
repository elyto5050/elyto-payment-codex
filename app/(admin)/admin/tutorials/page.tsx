"use client";

import { useMemo, useState } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import apiFetch from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardCard } from "@/components/dashboard/card-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TutorialForm from "@/components/tutorials/tutorial-form";

export default function AdminTutorialsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const debouncedQuery = useDebouncedValue(query, 350);

  const { data: postsResp, isLoading } = useQuery({
    queryKey: ["admin-tutorials", page, pageSize, debouncedQuery],
    queryFn: async () => {
      const q = debouncedQuery ? `&search=${encodeURIComponent(debouncedQuery)}` : "";
      return (await apiFetch(`/api/admin/tutorials?page=${page}&pageSize=${pageSize}${q}`)) as { data: any[]; meta?: any };
    },
    staleTime: 15000,
    retry: 1
  });

  const posts = useMemo(() => postsResp?.data ?? [], [postsResp?.data]);
  const meta = postsResp?.meta;

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      return await apiFetch(`/api/admin/tutorials/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch(`/api/admin/tutorials/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] })
  });

  const handleToggle = (id: string, current: boolean) => {
    updateMutation.mutate({ id, patch: { published: !current } });
  };

  const handleToggleLive = (id: string, current: boolean) => {
    updateMutation.mutate({ id, patch: { live: !current } });
  };

  const handleEdit = (tutorial: any) => {
    setEditing(tutorial);
  };

  const handleDelete = (id: string) => {
    // lightweight confirmation
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Delete this tutorial?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <DashboardHeader title="Tutorials Command Center" description="Create, edit, publish and manage tutorial videos for the marketing site." />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">{posts.length > 0 ? "Total tutorials" : "No tutorials"}</p>
          <p className="mt-2 text-lg font-semibold text-cyan-200">{posts.length.toLocaleString()}</p>
        </div>
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">Published</p>
          <p className="mt-2 text-lg font-semibold text-emerald-200">{posts.filter((p: any) => p.published).length.toLocaleString()}</p>
        </div>
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">Drafts</p>
          <p className="mt-2 text-lg font-semibold text-amber-200">{posts.filter((p: any) => !p.published).length.toLocaleString()}</p>
        </div>
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">Display order max</p>
          <p className="mt-2 text-lg font-semibold text-violet-200">{Math.max(0, posts.length)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <DashboardCard title={editing ? "Edit tutorial" : "Create tutorial"} subtitle="Composer">
          <div className="space-y-3">
            <TutorialForm initial={editing ?? undefined} onSaved={() => { setEditing(null); queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] }); }} />
            {editing && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="Tutorials" subtitle="Library">
          <div className="space-y-2">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
              <Input className="pl-6 h-7 text-xs" placeholder="Search tutorials" value={query} onChange={(e: any) => { setQuery(e.target.value); setPage(1); }} />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-6 text-xs text-zinc-500">Loading tutorials...</div>
              ) : posts.length ? (
                posts.map((t: any) => (
                  <div key={t.id} className="rounded-dense border border-white/10 bg-white/[0.02] p-2 hover:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">{t.title}</p>
                        <span className={`inline-block mt-0.5 rounded-dense px-1.5 py-0.5 text-[10px] ${t.published ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
                          {t.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleLive(t.id, !!t.live)} disabled={updateMutation.isLoading}>
                          {t.live ? "Live: ON" : "Set Live"}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleToggle(t.id, !!t.published)} disabled={updateMutation.isLoading}>
                          {t.published ? "Unpublish" : "Publish"}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleDelete(t.id)} disabled={deleteMutation.isLoading}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">{t.description || "No description"}</p>
                    <div className="text-[9px] text-zinc-600 mt-1 flex items-center gap-2">
                      <span>/tutorials/{t.slug}</span>
                      <span>•</span>
                      <span>{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : "No date"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-zinc-500">No tutorials found</div>
              )}
            </div>

            {meta && meta.totalPages && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-zinc-400">Page {meta.page ?? page} / {meta.totalPages}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                  <Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}>Next</Button>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
