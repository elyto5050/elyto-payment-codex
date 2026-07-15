"use client";

import { useMemo, useState } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { useQuery } from "@tanstack/react-query";
import apiFetch from "@/lib/api/client";
import { Activity, Download, Filter, Search, Shield, ShoppingCart, UserRound, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActivityLog = {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  actorUserId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

function iconFor(log: ActivityLog) {
  const key = `${log.action} ${log.entityType ?? ""}`.toLowerCase();
  if (key.includes("security") || key.includes("auth")) return Shield;
  if (key.includes("webhook")) return Webhook;
  if (key.includes("order")) return ShoppingCart;
  if (key.includes("user") || key.includes("team")) return UserRound;
  return Activity;
}

export default function ActivityPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const debouncedQuery = useDebouncedValue(query, 350);

  const { data: resp, isLoading } = useQuery<{ data: ActivityLog[]; meta?: { total?: number; page?: number; pageSize?: number; totalPages?: number } }>({
    queryKey: ["activity", page, pageSize, debouncedQuery, type],
    queryFn: async () => (await apiFetch(`/api/dashboard/activity?page=${page}&pageSize=${pageSize}${debouncedQuery ? `&search=${encodeURIComponent(debouncedQuery)}` : ""}${type && type !== "all" ? `&type=${encodeURIComponent(type)}` : ""}`)) as { data: ActivityLog[]; meta?: { total?: number; page?: number; pageSize?: number; totalPages?: number } },
    staleTime: 15000,
    retry: 1
  });

  const logs = useMemo(() => resp?.data ?? [], [resp?.data]);
  const meta = resp?.meta;
  const entityTypes = useMemo(() => {
    const types = (resp?.data ?? []).map((log) => log.entityType).filter((t): t is string => typeof t === "string");
    return ["all", ...Array.from(new Set(types))];
  }, [resp?.data]);

  function exportCsv() {
    const rows = [["Action", "Entity", "Entity ID", "Actor", "IP", "Created"], ...logs.map((log) => [log.action, log.entityType ?? "", log.entityId ?? "", log.actorUserId ?? "", log.ipAddress ?? "", log.createdAt])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "elyto-activity.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Audit trail</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Activity</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Searchable timeline for user actions, project changes, webhook events, and security operations.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 xl:min-w-[460px]">
            <Metric label="Events" value={meta?.total ?? logs.length} />
            <Metric label="Types" value={entityTypes.length - 1} />
            <Metric label="Showing" value={logs.length} />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Timeline</CardTitle>
              <p className="mt-1 text-sm text-zinc-500">Filter, inspect, and export workspace activity.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input className="pl-9" placeholder="Search activity" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
              </div>
              <select className="h-10 rounded-md border border-border bg-background px-3 text-sm text-zinc-300" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
                {entityTypes.map((entityType) => (
                  <option key={entityType} value={entityType ?? "all"}>{String(entityType)}</option>
                ))}
              </select>
              <Button variant="outline" className="gap-2" onClick={exportCsv}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 text-sm text-zinc-500">Loading...</div>
          ) : logs.length ? (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <ActivityRow key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-zinc-400">
                <Filter className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-medium text-white">No activity found</p>
              <p className="mt-2 text-sm text-zinc-500">No events match the current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
      {meta && meta.totalPages && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-zinc-400">Page {meta.page ?? page} / {meta.totalPages}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= (meta.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ log }: { log: ActivityLog }) {
  const Icon = iconFor(log);
  return (
    <div className="grid gap-4 p-5 transition-colors hover:bg-white/[0.025] md:grid-cols-[1fr_220px] md:items-center">
      <div className="flex min-w-0 gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{log.action}</p>
          <p className="mt-1 text-xs text-zinc-500">{log.entityType ?? "workspace"} {log.entityId ? `· ${log.entityId}` : ""}</p>
          <p className="mt-2 text-xs text-zinc-600">{log.ipAddress ?? "No IP recorded"}</p>
        </div>
      </div>
      <p className="text-xs text-zinc-500 md:text-right">{new Date(log.createdAt).toLocaleString()}</p>
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
