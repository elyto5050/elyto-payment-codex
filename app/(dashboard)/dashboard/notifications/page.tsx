"use client";

import { useMemo, useState } from "react";
import type { ElementType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Filter, Info, ShieldAlert, TriangleAlert } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, DashboardCard } from "@/components/dashboard/card-components";
import apiFetch from "@/lib/api/client";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt?: string | null;
  createdAt: string;
};

type Payload = {
  notifications: Notification[];
  unreadCount: number;
};

type FilterKey = "all" | "unread" | "security" | "warning";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page, pageSize],
    queryFn: async () => (await apiFetch(`/api/dashboard/notifications?page=${page}&pageSize=${pageSize}`)) as {
      data: Payload;
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }
  });

  const notifications = useMemo(() => data?.data?.notifications ?? [], [data?.data?.notifications]);
  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === "unread") return !item.readAt;
      if (filter === "security") return item.type === "SECURITY";
      if (filter === "warning") return item.type === "WARNING" || item.type === "ERROR";
      return true;
    });
  }, [notifications, filter]);

  const markRead = useMutation({
    mutationFn: async (id?: string) => {
      await apiFetch("/api/dashboard/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true })
      });
    },
    onMutate: async (id?: string) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", page, pageSize] });
      const previous = queryClient.getQueryData<{ data: Payload; meta: any }>(["notifications", page, pageSize]);
      if (previous) {
        const next = JSON.parse(JSON.stringify(previous));
        if (id) {
          next.data.notifications = next.data.notifications.map((n: any) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
          next.data.unreadCount = Math.max(0, next.data.unreadCount - (previous.data.notifications.find((n) => n.id === id && !n.readAt) ? 1 : 0));
        } else {
          next.data.notifications = next.data.notifications.map((n: any) => ({ ...n, readAt: new Date().toISOString() }));
          next.data.unreadCount = 0;
        }
        queryClient.setQueryData(["notifications", page, pageSize], next);
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["notifications", page, pageSize], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications", page, pageSize] })
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <DashboardHeader
            title="Notifications"
            description="Realtime updates across orders, webhooks, security, support, and billing."
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-7 text-xs rounded-dense" onClick={() => markRead.mutate(undefined)} disabled={markRead.isPending || !data?.data?.unreadCount}>
          <CheckCheck className="h-3 w-3 mr-2" /> Mark all read
        </Button>
          <div className="text-xs text-zinc-400">Page {data?.meta?.page ?? page} / {data?.meta?.totalPages ?? "?"}</div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= (data?.meta?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>

      <DashboardGrid columns={4}>
        <StatCard label="Total" value={notifications.length.toLocaleString()} tone="text-cyan-200" icon={Bell} />
        <StatCard label="Unread" value={data?.data?.unreadCount ?? 0} tone="text-amber-200" icon={Bell} />
        <StatCard label="Security" value={notifications.filter((item) => item.type === "SECURITY").length.toLocaleString()} tone="text-purple-200" icon={ShieldAlert} />
        <StatCard label="Warnings" value={notifications.filter((item) => item.type === "WARNING" || item.type === "ERROR").length.toLocaleString()} tone="text-red-200" icon={TriangleAlert} />
      </DashboardGrid>

      <DashboardCard title="Notification center" subtitle="Filter and acknowledge platform events">
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap mb-3">
            {(["all", "unread", "security", "warning"] as FilterKey[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-dense border px-2 py-1 text-xs capitalize transition-colors h-6 ${filter === item ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-dense border border-white/10 bg-white/[0.02]" />
                ))}
              </div>
            ) : filtered.length ? (
              filtered.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`w-full rounded-dense border border-white/10 bg-white/[0.02] p-2 text-left text-xs transition-colors hover:bg-white/[0.05] ${!notification.readAt ? "bg-cyan-400/[0.04] border-cyan-400/20" : ""}`}
                  onClick={() => markRead.mutate(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    <NotificationIcon type={notification.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="truncate font-medium text-white">{notification.title}</p>
                        {!notification.readAt && <span className="rounded-dense bg-cyan-500/20 px-1 py-0.5 text-[10px] text-cyan-200">Unread</span>}
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-500 line-clamp-1">{notification.body}</p>
                      <div className="mt-1 text-[10px] text-zinc-600 flex items-center gap-2">
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span className="capitalize">{notification.type.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState title="No notifications" description="Try adjusting your filters" icon="inbox" />
            )}
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  const security = type === "SECURITY";
  const warning = type === "WARNING" || type === "ERROR";
  const Icon = security ? ShieldAlert : warning ? TriangleAlert : Info;
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-dense border text-xs ${security ? "border-purple-400/20 bg-purple-400/10 text-purple-200" : warning ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"}`}>
      <Icon className="h-3 w-3" />
    </span>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: ElementType; label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-dense bg-white/[0.05] ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
        </div>
      </div>
    </div>
  );
}
