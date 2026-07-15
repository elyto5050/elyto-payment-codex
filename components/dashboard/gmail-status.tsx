"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, MailCheck, Unplug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type GmailConnection = {
  id: string;
  googleEmail?: string;
  email?: string;
  label?: string;
  status: string;
  lastSyncAt?: string | null;
  lastError?: string | null;
};

export default function GmailStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ["gmail-connections"],
    queryFn: async () => (await fetch("/api/dashboard/gmail")).json().then((r) => r.data as GmailConnection[])
  });

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Gmail health</CardTitle>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
            {data?.length ?? 0} inboxes
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : data?.length ? (
          <div className="divide-y divide-border">
            {data.map((connection) => {
              const healthy = connection.status === "ACTIVE";
              const Icon = healthy ? MailCheck : connection.status === "ERROR" ? AlertTriangle : Unplug;

              return (
                <div key={connection.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${healthy ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{connection.googleEmail ?? connection.email}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {connection.lastSyncAt ? `Last sync ${new Date(connection.lastSyncAt).toLocaleString()}` : "Waiting for first sync"}
                          </p>
                        </div>
                      </div>
                      {connection.lastError ? <p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{connection.lastError}</p> : null}
                    </div>
                    <div className={`rounded-full px-2.5 py-1 text-xs ${healthy ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}`}>
                      {connection.status.toLowerCase()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5">
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-zinc-500">
              No Gmail connections configured.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
