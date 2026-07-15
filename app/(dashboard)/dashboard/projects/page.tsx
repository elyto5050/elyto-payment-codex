"use client";

import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Activity, Box, FolderKanban, KeyRound, Plus, Search, Settings, Webhook, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, StatCard, DashboardCard } from "@/components/dashboard/card-components";
import { Badge } from "@/components/ui/badge";
import { DeleteProjectModal } from "@/components/dashboard/delete-project-modal";
import { showToast } from "@/components/dashboard/toast-container";
import apiFetch from "@/lib/api/client";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import EmptyState from "@/components/ui/empty-state";

type Project = {
  id: string;
  name: string;
  status: string;
  upiId?: string | null;
  logoUrl?: string | null;
  updatedAt?: string;
  _count: { orders: number; products: number };
  metrics?: {
    revenue: number;
    verificationRate: number;
    webhookSuccessRate: number;
  };
};

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [query, setQuery] = useState("");
  const [secretKey, setSecretKey] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await apiFetch("/api/dashboard/projects")) as Project[],
    staleTime: 15000,
    retry: 1
  });

  const projects = useMemo(() => data ?? [], [data]);
  const debouncedQuery = useDebouncedValue(query, 350);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(q) || project.upiId?.toLowerCase().includes(q));
  }, [projects, debouncedQuery]);

  const totals = useMemo(
    () => ({
      projects: projects.length,
      revenue: projects.reduce((sum, project) => sum + (project.metrics?.revenue ?? 0), 0),
      products: projects.reduce((sum, project) => sum + project._count.products, 0),
      orders: projects.reduce((sum, project) => sum + project._count.orders, 0)
    }),
    [projects]
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/dashboard/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, upiId: upiId || undefined })
      });
    },
    onSuccess: (result: any) => {
      setSecretKey(result?.secretKey ?? result?.data?.secretKey ?? null);
      setName("");
      setUpiId("");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => {
      showToast({ type: "error", title: "Create Failed", message: err instanceof Error ? err.message : String(err) });
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Header with Metrics */}
        <div>
          <DashboardHeader title="Projects" description="Manage payment verification, API keys, and webhooks" />

          {/* Metrics Grid */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Overview</p>
            <DashboardGrid columns={4}>
              <StatCard label="Total Projects" value={totals.projects} unit="active" />
              <StatCard label="Revenue" value={formatCurrency(totals.revenue)} />
              <StatCard label="Products" value={totals.products} unit="total" />
              <StatCard label="Orders" value={totals.orders} unit="total" />
            </DashboardGrid>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input className="pl-9 text-sm" placeholder="Search projects or UPI IDs" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-dense border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <DashboardCard>
            <div className="text-center py-8">
              <FolderKanban className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">No projects found</p>
              <p className="text-xs text-zinc-500 mt-1">Create a project to start verifying orders</p>
            </div>
          </DashboardCard>
        )}
      </div>

      {/* Sidebar - Create New Project */}
      <div className="lg:sticky lg:top-24 h-fit">
        <DashboardCard title="Create Project">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-2">Project Name</label>
              <Input placeholder="My Store" value={name} onChange={(event) => setName(event.target.value)} className="text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-2">UPI ID</label>
              <Input placeholder="merchant@upi" value={upiId} onChange={(event) => setUpiId(event.target.value)} className="text-sm" />
            </div>

            <Button className="w-full rounded-dense bg-cyan-600 hover:bg-cyan-700" disabled={!name || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>

            {secretKey && (
              <div className="rounded-dense border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                <p className="font-semibold mb-2">Save this key (shown once)</p>
                <code className="block bg-black/25 p-2 rounded-dense font-mono text-[10px] break-all">{secretKey}</code>
              </div>
            )}

            {createMutation.isError && <p className="text-xs text-red-400">{(createMutation.error as Error).message}</p>}

            <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
              <p className="text-xs font-semibold text-white mb-3">Includes</p>
              <div className="space-y-1 text-xs text-zinc-400">
                <p>✓ Verification tracking</p>
                <p>✓ API keys</p>
                <p>✓ Webhook delivery</p>
                <p>✓ Product catalog</p>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const deleteMutation = useMutation<string, any, string, { previous?: Project[] }>({
    mutationFn: async (projectId: string) => {
      return await apiFetch(`/api/dashboard/projects/${projectId}`, { method: "DELETE" });
    },
    onMutate: async (projectId: string) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previous = queryClient.getQueryData<Project[]>(["projects"]);
      if (previous) {
        queryClient.setQueryData(["projects"], previous.filter((p) => p.id !== projectId));
      }
      return { previous };
    },
    onError: (err, projectId, context) => {
      showToast({ type: "error", title: "Delete Failed", message: err instanceof Error ? err.message : String(err) });
      if (context?.previous) queryClient.setQueryData(["projects"], context.previous);
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Project Deleted", message: `${project.name} has been permanently deleted.` });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  return (
    <>
      <div className="group rounded-dense border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <ProjectAvatar project={project} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{project.name}</p>
              <p className="truncate text-xs text-zinc-500">{project.upiId || "No UPI"}</p>
            </div>
          </div>
          <Badge variant={project.status === "ACTIVE" ? "success" : "warning"} className="flex-shrink-0 text-[10px]">
            {project.status.toLowerCase()}
          </Badge>
        </div>

        {/* Compact Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="rounded-dense bg-white/[0.03] p-2 border border-white/5">
            <p className="text-zinc-500 text-[10px]">Revenue</p>
            <p className="font-semibold text-white text-sm">{formatCurrency(project.metrics?.revenue ?? 0)}</p>
          </div>
          <div className="rounded-dense bg-white/[0.03] p-2 border border-white/5">
            <p className="text-zinc-500 text-[10px]">Orders</p>
            <p className="font-semibold text-white text-sm">{project._count.orders}</p>
          </div>
          <div className="rounded-dense bg-white/[0.03] p-2 border border-white/5">
            <p className="text-zinc-500 text-[10px]">Verified</p>
            <p className="font-semibold text-white text-sm">{project.metrics?.verificationRate ?? 0}%</p>
          </div>
          <div className="rounded-dense bg-white/[0.03] p-2 border border-white/5">
            <p className="text-zinc-500 text-[10px]">Webhook</p>
            <p className="font-semibold text-white text-sm">{project.metrics?.webhookSuccessRate ?? 100}%</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Link href={`/dashboard/projects/${project.id}`} className="rounded-dense border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] flex items-center justify-center gap-1 transition-colors">
            <Settings className="h-3 w-3" />
            Settings
          </Link>
          <Link href={`/dashboard/products?projectId=${project.id}`} className="rounded-dense border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] flex items-center justify-center gap-1 transition-colors">
            <Box className="h-3 w-3" />
            Products
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/dashboard/projects/${project.id}`} className="w-full rounded-dense border border-white/10 bg-cyan-600/20 hover:bg-cyan-600/30 px-2 py-1.5 text-xs font-semibold text-cyan-200 flex items-center justify-center gap-1 transition-colors">
            Open
            <ArrowRight className="h-3 w-3" />
          </Link>
          <button onClick={() => setDeleteModalOpen(true)} className="w-full rounded-dense border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 text-xs font-semibold text-red-300 flex items-center justify-center gap-1 transition-colors">
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      </div>

      <DeleteProjectModal
        isOpen={deleteModalOpen}
        projectName={project.name}
        projectId={project.id}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async (projectId) => {
          await deleteMutation.mutateAsync(projectId);
        }}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

function ProjectAvatar({ project }: { project: Project }) {
  if (project.logoUrl) {
    return <Image src={project.logoUrl} alt={project.name} width={32} height={32} className="h-8 w-8 rounded-dense border border-white/10 object-cover flex-shrink-0" unoptimized />;
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-dense border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
      <FolderKanban className="h-4 w-4" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
