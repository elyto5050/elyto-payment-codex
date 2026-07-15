"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import apiFetch from "@/lib/api/client";
import { Copy, KeyRound, Landmark, Package, ReceiptText, RotateCw, Settings, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectLogoUpload } from "@/components/project-logo-upload";

type ProjectDetail = {
  id: string;
  name: string;
  logoUrl?: string | null;
  upiId?: string | null;
  publicKey?: string | null;
  status: string;
  _count?: { orders: number; products: number; transactions: number };
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => (await apiFetch(`/api/dashboard/projects/${id}`)) as ProjectDetail
  });

  useEffect(() => {
    if (project?.upiId) setUpiId(project.upiId);
  }, [project?.upiId]);

  const updateMutation = useMutation({
    mutationFn: async (data: { upiId?: string; logoUrl?: string }) => {
      return await apiFetch(`/api/dashboard/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", id] })
  });

  const regenMutation = useMutation({
    mutationFn: async () => {
      return (await apiFetch(`/api/dashboard/projects/${id}/regenerate-keys`, { method: "POST" })) as { secretKey: string };
    },
    onSuccess: (data: { secretKey: string }) => setSecretKey(data.secretKey)
  });

  async function copyPublicKey() {
    if (!project?.publicKey) return;
    await navigator.clipboard.writeText(project.publicKey);
  }

  if (isLoading) return <div className="h-72 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.03]" />;
  if (!project) return <p className="text-rose-400">Project not found.</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            {project.logoUrl ? (
              <Image src={project.logoUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-3xl border border-white/10 object-cover" unoptimized />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                <Settings className="h-7 w-7" />
              </div>
            )}
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Project</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">{project.name}</h1>
              <p className="mt-2 text-sm text-zinc-400">{project.upiId ?? "No UPI ID configured"}</p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            {project.status.toLowerCase()}
          </span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={<ReceiptText className="h-4 w-4" />} label="Orders" value={project._count?.orders ?? 0} />
        <Metric icon={<Package className="h-4 w-4" />} label="Products" value={project._count?.products ?? 0} />
        <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Transactions" value={project._count?.transactions ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-4 w-4" /> UPI settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <Input value={upiId} placeholder="merchant@upi" onChange={(event) => setUpiId(event.target.value)} />
              <Button onClick={() => updateMutation.mutate({ upiId })} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save UPI ID"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> API keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Public key</p>
                <div className="mt-2 flex items-center gap-3">
                  <code className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-200">{project.publicKey ?? "-"}</code>
                  <Button variant="ghost" size="sm" onClick={copyPublicKey}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => regenMutation.mutate()} disabled={regenMutation.isPending}>
                <RotateCw className={`h-4 w-4 ${regenMutation.isPending ? "animate-spin" : ""}`} /> Regenerate secret key
              </Button>
              {secretKey ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
                  Save this new secret key now. It will not be shown again.
                  <code className="mt-3 block break-all rounded-xl bg-black/25 p-3 font-mono">{secretKey}</code>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Project logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <p className="text-sm text-zinc-500">Use a square logo for project cards, checkout screens, and internal navigation.</p>
            <ProjectLogoUpload currentUrl={project.logoUrl} onUploaded={(url) => updateMutation.mutate({ logoUrl: url })} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{icon}</span>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
          <p className="mt-1 text-sm font-medium text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
