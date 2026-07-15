"use client";

import { useMemo, useState } from "react";
import apiFetch from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, LifeBuoy, MessageSquarePlus, NotebookText, Send, ShieldQuestion, TicketCheck } from "lucide-react";
import { SupportTicketIntake } from "@/components/support/ticket-intake";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt?: string;
  messages?: Array<{ body: string; createdAt: string }>;
};

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ subject: "", message: "", priority: "NORMAL" });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support"],
    queryFn: async () => (await apiFetch("/api/dashboard/support")) as Ticket[]
  });

  const list = useMemo(() => tickets ?? [], [tickets]);
  const open = list.filter((ticket) => ticket.status === "OPEN").length;
  const urgent = list.filter((ticket) => ticket.priority === "URGENT" || ticket.priority === "HIGH").length;

  const createMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/dashboard/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    },
    onSuccess: () => {
      setForm({ subject: "", message: "", priority: "NORMAL" });
      queryClient.invalidateQueries({ queryKey: ["support"] });
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Help desk</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Support</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Submit support tickets, track priorities, and keep billing, integration, and verification issues organized.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<LifeBuoy className="h-4 w-4" />} label="Tickets" value={list.length} />
        <Metric icon={<TicketCheck className="h-4 w-4" />} label="Open" value={open} />
        <Metric icon={<ShieldQuestion className="h-4 w-4" />} label="Priority" value={urgent} />
        <Metric icon={<NotebookText className="h-4 w-4" />} label="KB" value="Ready" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="border-b border-border">
            <div>
              <CardTitle>Tickets</CardTitle>
              <p className="mt-1 text-sm text-zinc-500">Status, priority, and latest activity for support requests.</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
                ))}
              </div>
            ) : list.length ? (
              <div className="divide-y divide-border">
                {list.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-zinc-400">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-white">No tickets yet</p>
                <p className="mt-2 text-sm text-zinc-500">Create a ticket when you need help with verification, Gmail, billing, or webhooks.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4" /> New ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <SupportTicketIntake
                onSubmit={async (issue) => {
                  // Use first line as subject fallback
                  const subject = issue.split("\n")[0].slice(0, 120) || "Support request";
                  await apiFetch("/api/dashboard/support", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subject, message: issue, priority: "NORMAL" })
                  });
                  queryClient.invalidateQueries({ queryKey: ["support"] });
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Knowledge base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-sm text-zinc-400">
              <p>Common topics: Gmail OAuth, UTR parsing, webhook signatures, quota increases, and API key rotation.</p>
              <p>For urgent payment verification issues, include project name, order ID, and submitted UTR.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <Link href={`/dashboard/support/${ticket.id}`} className="block">
      <div className="grid gap-4 p-5 transition-colors hover:bg-white/[0.025] md:grid-cols-[1fr_160px_150px] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">{ticket.subject}</p>
            <Badge label={ticket.priority} tone={ticket.priority === "URGENT" || ticket.priority === "HIGH" ? "warning" : "neutral"} />
          </div>
          <p className="mt-2 line-clamp-1 text-sm text-zinc-500">{ticket.messages?.[0]?.body ?? "No messages yet"}</p>
        </div>
      </div>
    </Link>
  );
}

function Badge({ label, tone }: { label: string; tone: "success" | "warning" | "neutral" }) {
  const styles = {
    success: "bg-emerald-400/10 text-emerald-200",
    warning: "bg-amber-400/10 text-amber-200",
    neutral: "bg-white/[0.04] text-zinc-300"
  };
  return <span className={`w-fit rounded-full px-2.5 py-1 text-xs capitalize ${styles[tone]}`}>{label.toLowerCase()}</span>;
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

function FormLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
