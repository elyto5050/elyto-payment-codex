"use client";

import { useMemo } from "react";
import apiFetch from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, MailCheck, PlugZap, RefreshCcw, ShieldCheck, AlertCircle, Workflow, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, StatCard, DashboardCard } from "@/components/dashboard/card-components";
import { useToast } from "@/components/ui/toast-context";

type GmailConnection = {
  id: string;
  googleEmail: string;
  status: string;
  scope?: string;
  lastSyncAt?: string | null;
  lastErrorAt?: string | null;
  lastError?: string | null;
  createdAt?: string;
};

export default function GmailPage() {
  const { addToast } = useToast();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["gmail"],
    queryFn: async () => (await apiFetch("/api/dashboard/gmail")) as GmailConnection[]
  });

  const connections = useMemo(() => data ?? [], [data]);
  // Limit to 1 Gmail connection per Elyto account
  const maxConnectionsReached = connections.length >= 1;
  const active = connections.filter((connection) => connection.status === "ACTIVE").length;
  const errors = connections.filter((connection) => connection.status === "ERROR" || connection.lastError).length;
  const lastSync = connections
    .map((connection) => connection.lastSyncAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  const handleDisconnect = async (id: string) => {
    // replaced by optimistic mutation
  };

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await apiFetch(`/api/dashboard/gmail/${id}`, { method: "DELETE" }),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["gmail"] });
      const previous = queryClient.getQueryData<GmailConnection[]>(["gmail"]);
      if (previous) queryClient.setQueryData(["gmail"], previous.filter((c) => c.id !== id));
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["gmail"], context.previous);
      addToast("Failed to disconnect Gmail account", "error");
    },
    onSuccess: () => {
      addToast("Gmail account disconnected", "success");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["gmail"] })
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Gmail"
        description="Connect Gmail inboxes to sync UPI payment emails"
      />

      {/* KPI Stats */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Connection Status</p>
        <DashboardGrid columns={4}>
          <StatCard label="Connected" value={connections.length} unit="account" trend="neutral" />
          <StatCard label="Active" value={active} unit="syncing" trend={active > 0 ? "up" : "neutral"} />
          <StatCard label="Errors" value={errors} unit={errors ? "needs attention" : "healthy"} trend={errors > 0 ? "down" : "up"} />
          <StatCard label="Last Sync" value={lastSync ? new Date(lastSync).toLocaleDateString() : "Never"} trend="neutral" />
        </DashboardGrid>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Connections List */}
        <DashboardCard
          title="Connected Accounts"
          subtitle={connections.length ? `${connections.length} account connected (max 1)` : "No accounts connected"}
        >
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-zinc-500 py-8">Loading...</div>
            ) : connections.length ? (
              connections.map((connection) => (
                <ConnectionRow key={connection.id} connection={connection} onDisconnect={() => deleteMutation.mutate(connection.id)} />
              ))
            ) : (
              <div className="text-center py-8">
                <MailCheck className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">No Gmail accounts connected</p>
                <p className="text-xs text-zinc-500 mt-1">Connect your Gmail to sync transaction emails</p>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Connect Button */}
          <DashboardCard title="Connect Gmail">
            <div className="space-y-3">
              {maxConnectionsReached && (
                <div className="rounded-dense bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200">
                  <p className="font-semibold">Maximum accounts reached</p>
                  <p className="mt-1">Disconnect current account to add a new one</p>
                </div>
              )}
              <Button
                className="w-full gap-2 rounded-dense bg-cyan-600 hover:bg-cyan-700"
                disabled={maxConnectionsReached}
                onClick={() => {
                  window.location.href = "/api/dashboard/gmail/connect";
                }}
              >
                <PlugZap className="h-4 w-4" />
                {maxConnectionsReached ? "At Limit" : "Connect Gmail"}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 rounded-dense"
                disabled={isFetching}
                onClick={async () => {
                  try {
                    await apiFetch("/api/dashboard/gmail/sync", { method: "POST" });
                    await refetch();
                    addToast("Gmail sync requested", "success");
                  } catch (err) {
                    addToast("Failed to request Gmail sync", "error");
                  }
                }}
              >
                <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </DashboardCard>

          {/* Setup Progress */}
          <DashboardCard title="Setup Progress">
            <div className="space-y-2 text-xs">
              <div className={`p-2 rounded-dense border ${active > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.03] border-white/10"}`}>
                <p className="font-semibold text-white">✓ Gmail authorized</p>
              </div>
              <div className={`p-2 rounded-dense border ${active > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.03] border-white/10"}`}>
                <p className="font-semibold text-white">✓ Email syncing</p>
              </div>
              <div className={`p-2 rounded-dense border ${errors === 0 && active > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.03] border-white/10"}`}>
                <p className="font-semibold text-white">✓ Verification ready</p>
              </div>
            </div>
          </DashboardCard>

          {/* Diagnostics */}
          <DashboardCard title="Diagnostics">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-dense bg-white/[0.03]">
                <div className="flex items-center gap-2 text-zinc-400">
                  <ShieldCheck className="h-3 w-3 text-cyan-200" />
                  Tokens
                </div>
                <span className="text-white font-semibold">Encrypted</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-dense bg-white/[0.03]">
                <div className="flex items-center gap-2 text-zinc-400">
                  <MailCheck className="h-3 w-3 text-cyan-200" />
                  Google OAuth
                </div>
                <span className="text-white font-semibold">Ready</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-dense bg-white/[0.03]">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Workflow className="h-3 w-3 text-cyan-200" />
                  Parser
                </div>
                <span className="text-white font-semibold">Active</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

function ConnectionRow({ connection, onDisconnect }: { connection: GmailConnection; onDisconnect: () => void }) {
  const healthy = connection.status === "ACTIVE" && !connection.lastError;

  return (
    <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-dense border ${healthy ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200"}`}>
            {healthy ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{connection.googleEmail}</p>
            <p className="truncate text-xs text-zinc-500">{connection.scope || "Gmail read access"}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-dense px-2 py-1 text-xs font-semibold ${healthy ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200"}`}>
          {connection.status.toLowerCase()}
        </span>
      </div>

      {connection.lastError && (
        <div className="rounded-dense bg-red-500/10 border border-red-500/30 p-2 mb-2 text-xs text-red-200">
          {connection.lastError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <p className="text-zinc-500 text-[10px]">Last Sync</p>
          <p className="font-semibold text-white">{connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : "Never"}</p>
        </div>
        <div>
          <p className="text-zinc-500 text-[10px]">Connected</p>
          <p className="font-semibold text-white">{connection.createdAt ? new Date(connection.createdAt).toLocaleDateString() : "Today"}</p>
        </div>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="w-full h-7 text-xs gap-2 rounded-dense text-red-300 hover:bg-red-400/10"
        onClick={onDisconnect}
      >
        <Trash2 className="h-3 w-3" />
        Disconnect
      </Button>
    </div>
  );
}
