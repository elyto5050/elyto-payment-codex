"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiFetch from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TicketDetailPage({ params }: { params: any }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["support", params.id],
    queryFn: async () => await apiFetch(`/api/dashboard/support/${params.id}`)
  });

  const replyMutation = useMutation({
    mutationFn: async (payload: string | { message: string; action?: string }) => {
      const body = typeof payload === "string" ? { message: payload } : payload;
      return await apiFetch(`/api/dashboard/support/${params.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["support"] });
      queryClient.invalidateQueries({ queryKey: ["support", params.id] });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-3">Back</Button>
        <h2 className="text-2xl font-semibold">{ticket?.subject ?? "Support ticket"}</h2>
        <p className="text-sm text-zinc-400">Status: {ticket?.status}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div>
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                (ticket?.messages ?? []).map((m: any) => (
                  <div key={m.id} className="rounded-dense bg-white/[0.02] border border-white/10 p-3">
                    <p className="text-sm text-zinc-300">{m.body}</p>
                    <p className="mt-2 text-xs text-zinc-500">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="mt-4">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full min-h-[120px] rounded-dense bg-white/[0.03] border border-white/10 p-3 text-sm text-white" />
            <div className="mt-2 flex gap-2">
              <Button disabled={!message.trim() || replyMutation.isPending} onClick={() => replyMutation.mutate(message)}>
                {replyMutation.isPending ? "Sending..." : "Send reply"}
              </Button>
              <Button
                variant="outline"
                disabled={!message.trim() || replyMutation.isPending}
                onClick={() => replyMutation.mutate({ message, action: "resolve" })}
              >
                Mark resolved and reply
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm text-zinc-400">
              <p>Priority: {ticket?.priority}</p>
              <p>Created: {ticket?.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"}</p>
              <p>Updated: {ticket?.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
