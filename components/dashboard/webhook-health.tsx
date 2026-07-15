"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, RadioTower, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type LastDelivery = { status?: string; at?: string; error?: string };
type WebhookEndpoint = {
  id: string;
  name: string;
  project?: string;
  url?: string;
  healthy?: boolean;
  successRate?: number;
  lastDelivery?: LastDelivery | null;
};

export default function WebhookHealth() {
  const { data, isLoading } = useQuery({
    queryKey: ["webhook-health"],
    queryFn: async () => (await fetch("/api/dashboard/webhooks/health")).json().then((r) => r.data as WebhookEndpoint[])
  });

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Webhook health</CardTitle>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
            {data?.length ?? 0} endpoints
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : data?.length ? (
          <div className="divide-y divide-border">
            {data.map((endpoint) => (
              <div key={endpoint.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${endpoint.healthy ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200"}`}>
                        {endpoint.healthy ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{endpoint.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">{endpoint.project}</p>
                      </div>
                    </div>
                    <p className="mt-3 truncate rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-zinc-500">{endpoint.url}</p>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${endpoint.healthy ? "text-emerald-300" : "text-rose-300"}`}>{endpoint.successRate}%</div>
                    <div className="text-xs text-zinc-500">{endpoint.healthy ? "Healthy" : "Needs attention"}</div>
                  </div>
                </div>
                {endpoint.lastDelivery ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                      <RadioTower className="h-3.5 w-3.5" />
                      Last: {endpoint.lastDelivery.status} at {endpoint.lastDelivery.at ? new Date(endpoint.lastDelivery.at).toLocaleString() : "-"}
                    </div>
                    {endpoint.lastDelivery.error ? <div className="mt-1 text-rose-400">Error: {endpoint.lastDelivery.error}</div> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-zinc-500">
              No webhook endpoints configured.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
