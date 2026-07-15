"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiFetch from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/card-components";
import { useToast } from "@/components/ui/toast-context";

export default function AdminTicketsClient() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => (await apiFetch("/api/admin/support/tickets")) as any[]
  });

  const { data: me } = useQuery({
    queryKey: ["admin-me"],
    queryFn: async () => (await apiFetch("/api/admin/me")) as any
  });

  const assignMutation = useMutation({
    mutationFn: async ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) => {
      return await apiFetch(`/api/admin/support/tickets/${ticketId}/assign`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assigneeId }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      addToast("Assigned", "success");
    },
    onError: () => addToast("Failed to assign", "error")
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ ticketId, resolution }: { ticketId: string; resolution: string }) => {
      return await apiFetch(`/api/admin/support/tickets/${ticketId}/resolve`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolution }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      addToast("Resolved", "success");
    },
    onError: () => addToast("Failed to resolve", "error")
  });

  const escalateMutation = useMutation({
    mutationFn: async ({ ticketId, escalationReason }: { ticketId: string; escalationReason: string }) => {
      return await apiFetch(`/api/admin/support/tickets/${ticketId}/escalate`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ escalationReason }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      addToast("Escalated", "success");
    },
    onError: () => addToast("Failed to escalate", "error")
  });

  return (
    <div>
      <DashboardCard title="Admin queue" subtitle="Manage platform tickets">
        {isLoading ? (
          <div className="p-6">Loading…</div>
        ) : tickets?.length ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto p-3">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{t.subject}</p>
                    <p className="text-xs text-zinc-500 mt-1">{t.messages?.[0]?.body ?? "No message"}</p>
                    <p className="text-xs text-zinc-600 mt-1">Org: {t.organization?.name ?? "-"}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => assignMutation.mutate({ ticketId: t.id, assigneeId: me?.id })} disabled={assignMutation.isPending}>
                      Assign to me
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const userId = window.prompt("Assign to user id:");
                      if (userId) assignMutation.mutate({ ticketId: t.id, assigneeId: userId });
                    }}>
                      Assign
                    </Button>
                    <Button size="sm" onClick={() => {
                      const res = window.prompt("Resolution message:");
                      if (res) resolveMutation.mutate({ ticketId: t.id, resolution: res });
                    }}>
                      Resolve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      const reason = window.prompt("Escalation reason:");
                      if (reason) escalateMutation.mutate({ ticketId: t.id, escalationReason: reason });
                    }}>
                      Escalate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-zinc-500">No tickets</div>
        )}
      </DashboardCard>
    </div>
  );
}
