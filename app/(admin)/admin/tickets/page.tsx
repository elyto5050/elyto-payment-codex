import type { ElementType } from "react";
import { AlertTriangle, LifeBuoy, TicketCheck, TimerReset } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import AdminTicketsClient from "./tickets-client";

export default async function AdminTicketsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="Support Tickets" description="Platform-wide support queue across all organizations" />
      <AdminTicketsClient />
    </div>
  );
}

function Badge({ label, warning }: { label: string; warning?: boolean }) {
  return (
    <span className={`rounded-dense px-2 py-0.5 text-xs whitespace-nowrap ${warning ? "bg-amber-400/10 text-amber-200 border border-amber-400/20" : "bg-white/[0.04] text-zinc-300 border border-white/10"}`}>
      {label.toLowerCase()}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: ElementType; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-dense bg-white/[0.05] ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
