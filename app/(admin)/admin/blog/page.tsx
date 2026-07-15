"use client";

import { useMemo, useState } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import apiFetch from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Search, Trash2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardCard } from "@/components/dashboard/card-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BlogPost = {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminBlogPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", published: false });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const debouncedQuery = useDebouncedValue(query, 350);

  const { data: postsResp, isLoading } = useQuery<{ data: BlogPost[]; meta?: { total?: number; page?: number; pageSize?: number; totalPages?: number } }>({
    queryKey: ["admin-blog", page, pageSize, debouncedQuery],
    queryFn: async () => (await apiFetch(`/api/admin/blog?page=${page}&pageSize=${pageSize}${debouncedQuery ? `&search=${encodeURIComponent(debouncedQuery)}` : ""}`)) as { data: BlogPost[]; meta?: { total?: number; page?: number; pageSize?: number; totalPages?: number } },
    staleTime: 15000,
    retry: 1
  });

  const posts = useMemo(() => postsResp?.data ?? [], [postsResp?.data]);
  const meta = postsResp?.meta;

  const stats = useMemo(() => {
    const published = posts.filter((post: BlogPost) => post.published).length;
    const drafts = posts.length - published;
    const words = posts.reduce((total: number, post: BlogPost) => total + (post.content || "").trim().split(/\s+/).filter(Boolean).length, 0);
    return { published, drafts, words };
  }, [posts]);

  const createMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    },
    onSuccess: () => {
      setForm({ title: "", excerpt: "", content: "", published: false });
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (slug: string) => {
      return await apiFetch(`/api/admin/blog?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog"] })
  });

  const draftWords = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <DashboardHeader title="Blog Command Center" description="Plan, draft, publish, and clean up public content from the owner workspace." />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">{posts.length > 0 ? "Total posts" : "No posts"}</p>
          <p className="mt-2 text-lg font-semibold text-cyan-200">{posts.length.toLocaleString()}</p>
        </div>
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">Published</p>
          <p className="mt-2 text-lg font-semibold text-emerald-200">{stats.published.toLocaleString()}</p>
        </div>
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">Drafts</p>
          <p className="mt-2 text-lg font-semibold text-amber-200">{stats.drafts.toLocaleString()}</p>
        </div>
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-500">Indexed words</p>
          <p className="mt-2 text-lg font-semibold text-violet-200">{stats.words.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <DashboardCard title="Create article" subtitle="Composer">
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-7 text-xs" />
            <Input placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="h-7 text-xs" />
            <textarea
              className="min-h-[200px] w-full resize-y rounded-dense border border-white/10 bg-black/30 px-3 py-2 text-xs leading-5 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-300/50"
              placeholder="Content in markdown"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <div className="flex items-center justify-between gap-3 rounded-dense border border-white/10 bg-white/[0.02] p-2">
              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  className="h-3 w-3 accent-cyan-400"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Publish immediately
              </label>
              <span className="text-xs text-zinc-500">{draftWords.toLocaleString()} words</span>
            </div>
            <Button className="w-full h-7 text-xs rounded-dense" onClick={() => createMutation.mutate()} disabled={!form.title || !form.content || createMutation.isPending}>
              <Save className="mr-2 h-3 w-3" />
              {createMutation.isPending ? "Saving..." : form.published ? "Publish" : "Save"}
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard title="Posts" subtitle="Library">
          <div className="space-y-2">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
              <Input className="pl-6 h-7 text-xs" placeholder="Search posts" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-6 text-xs text-zinc-500">Loading posts...</div>
              ) : posts.length ? (
                posts.map((post: BlogPost) => (
                  <div key={post.slug} className="rounded-dense border border-white/10 bg-white/[0.02] p-2 hover:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">{post.title}</p>
                        <span className={`inline-block mt-0.5 rounded-dense px-1.5 py-0.5 text-[10px] ${post.published ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
                          {post.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => deleteMutation.mutate(post.slug)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">{post.excerpt || "No excerpt"}</p>
                    <div className="text-[9px] text-zinc-600 mt-1 flex items-center gap-2">
                      <span>/blog/{post.slug}</span>
                      <span>•</span>
                      <span>{post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : "No date"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-zinc-500">No posts found</div>
              )}

              {meta && meta.totalPages && meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-zinc-400">Page {meta.page ?? page} / {meta.totalPages}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <Button size="sm" variant="outline" disabled={page >= (meta.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
