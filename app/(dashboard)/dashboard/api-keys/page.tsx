"use client";

import { useMemo, useState } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import apiFetch from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock3, EyeOff, KeyRound, LockKeyhole, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  type: string;
  environment?: string;
  scopes: string[];
  project?: { name: string } | null;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
};

export default function ApiKeysPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => (await apiFetch("/api/dashboard/api-keys")) as ApiKey[],
    staleTime: 15000,
    retry: 1
  });

  const keys = useMemo(() => data ?? [], [data]);
  const debouncedQuery = useDebouncedValue(query, 350);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return keys;
    return keys.filter((key) => `${key.name} ${key.keyPrefix} ${key.type} ${key.project?.name ?? ""} ${key.scopes.join(" ")}`.toLowerCase().includes(q));
  }, [keys, debouncedQuery]);

  const secretKeys = keys.filter((key) => key.type === "SECRET").length;
  const publicKeys = keys.filter((key) => key.type === "PUBLIC").length;
  const usedKeys = keys.filter((key) => key.lastUsedAt).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Vault</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">API Keys</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Masked project credentials, scopes, usage signals, and security status for server and public integrations.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 xl:min-w-[460px]">
            <Metric label="Secret" value={secretKeys} />
            <Metric label="Public" value={publicKeys} />
            <Metric label="Used" value={usedKeys} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Key inventory</CardTitle>
                <p className="mt-1 text-sm text-zinc-500">Keys are created with projects and secrets are only shown once.</p>
              </div>
              <div className="relative md:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input className="pl-9" placeholder="Search keys, projects, scopes" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
                ))}
              </div>
            ) : filtered.length ? (
              <div className="divide-y divide-border">
                {filtered.map((key) => (
                  <KeyRow key={key.id} item={key} />
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-zinc-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-white">No API keys found</p>
                <p className="mt-2 text-sm text-zinc-500">Create a project to generate public and secret keys automatically.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Security posture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <Posture icon={<EyeOff className="h-4 w-4" />} label="Secrets" value="Masked at rest" tone="success" />
              <Posture icon={<LockKeyhole className="h-4 w-4" />} label="Storage" value="Hashed keys" tone="success" />
              <Posture icon={<AlertTriangle className="h-4 w-4" />} label="Rotation" value="Project settings" tone="warning" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Usage notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-sm text-zinc-400">
              <p>Use secret keys only on trusted servers. Public keys can identify projects in client-side checkout flows.</p>
              <p>Regenerate keys from project settings when a secret may have been exposed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KeyRow({ item }: { item: ApiKey }) {
  const secret = item.type === "SECRET";
  return (
    <div className="grid gap-4 p-5 transition-colors hover:bg-white/[0.025] xl:grid-cols-[1fr_180px_180px] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
          <span className={`rounded-full px-2.5 py-1 text-xs ${secret ? "bg-purple-400/10 text-purple-200" : "bg-cyan-400/10 text-cyan-200"}`}>
            {item.type.toLowerCase()}
          </span>
        </div>
        <p className="mt-2 font-mono text-xs text-zinc-500">{item.keyPrefix}************************</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(item.scopes ?? []).map((scope) => (
            <span key={scope} className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[11px] text-zinc-400">
              {scope}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Project</p>
        <p className="mt-1 text-sm text-zinc-200">{item.project?.name ?? "Org-wide"}</p>
      </div>
      <div className="xl:text-right">
        <p className="flex items-center gap-1 text-sm text-zinc-300 xl:justify-end">
          <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
          {item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleDateString() : "Never used"}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{item.environment?.toLowerCase() ?? "live"}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Posture({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "success" | "warning" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${tone === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200"}`}>
          {icon}
        </span>
        <p className="text-sm text-zinc-300">{label}</p>
      </div>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
