"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Box, Search, Shield, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type ActivityLog = {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string | Date;
};

function iconFor(log: ActivityLog) {
  const key = `${log.action} ${log.entityType ?? ""}`.toLowerCase();
  if (key.includes("security")) return Shield;
  if (key.includes("webhook")) return Webhook;
  if (key.includes("product") || key.includes("order")) return Box;
  return Activity;
}

export default function ActivityFeed() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => (await fetch("/api/dashboard/activity")).json().then((r) => r.data as ActivityLog[])
  });

  const filtered = useMemo(() => {
    const logs = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => `${log.action} ${log.entityType ?? ""} ${log.entityId ?? ""}`.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Realtime activity</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">Audit trail across orders, projects, webhooks, and security.</p>
          </div>
          <div className="relative md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input className="pl-9" placeholder="Filter events" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filtered.length ? (
          <div className="divide-y divide-border">
            {filtered.slice(0, 12).map((log) => {
              const Icon = iconFor(log);
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 transition-colors hover:bg-white/[0.025]">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{log.action}</p>
                        <p className="mt-1 text-xs text-zinc-500">{log.entityType ?? "platform"} {log.entityId ? `· ${log.entityId}` : ""}</p>
                      </div>
                      <time className="shrink-0 text-xs text-zinc-500">{new Date(log.createdAt).toLocaleString()}</time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-zinc-500">No activity matches this view.</div>
        )}
      </CardContent>
    </Card>
  );
}
