"use client";

import React from "react";
import { Activity, FolderKanban, MailCheck, ReceiptText, TrendingUp, Webhook } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ICONS = {
  revenue: TrendingUp,
  orders: ReceiptText,
  verification: Activity,
  projects: FolderKanban,
  webhooks: Webhook,
  gmail: MailCheck
};

export function WidgetCard({
  title,
  value,
  subtitle,
  tone = "neutral",
  icon
}: {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  tone?: "neutral" | "success" | "warning" | "accent";
  icon: keyof typeof ICONS;
}) {
  const Icon = ICONS[icon];

  return (
    <Card className="group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.045]">
      <CardContent className="relative p-5">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px",
            tone === "success" && "bg-emerald-400/50",
            tone === "warning" && "bg-amber-400/50",
            tone === "accent" && "bg-cyan-400/50",
            tone === "neutral" && "bg-white/10"
          )}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{title}</p>
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl border",
              tone === "success" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
              tone === "warning" && "border-amber-400/20 bg-amber-400/10 text-amber-200",
              tone === "accent" && "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
              tone === "neutral" && "border-white/10 bg-white/[0.04] text-zinc-300"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="text-3xl font-semibold tracking-tight text-white">{value}</div>
          {subtitle ? <div className="text-sm text-zinc-500">{subtitle}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

type DashboardStats = {
  revenueDisplay?: string;
  totalOrders?: number | string;
  verificationRate?: number | string;
  activeProjects?: number | string;
  webhookSuccessRate?: number | string;
  gmailCount?: number;
};

export default function WidgetsRow({ stats }: { stats?: DashboardStats }) {
  const verificationRate = typeof stats?.verificationRate === "number" ? stats.verificationRate : 0;
  const webhookSuccessRate = typeof stats?.webhookSuccessRate === "number" ? stats.webhookSuccessRate : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <WidgetCard icon="revenue" tone="accent" title="Revenue" value={stats ? stats.revenueDisplay : "-"} subtitle="Collected through verified orders" />
      <WidgetCard icon="orders" title="Orders" value={stats ? stats.totalOrders : "-"} subtitle="Total order volume" />
      <WidgetCard icon="verification" tone={verificationRate >= 85 ? "success" : "warning"} title="Verification" value={stats ? `${stats.verificationRate}%` : "-"} subtitle="UTR match success" />
      <WidgetCard icon="projects" title="Projects" value={stats ? stats.activeProjects : "-"} subtitle="Active workspaces" />
      <WidgetCard icon="webhooks" tone={webhookSuccessRate >= 85 ? "success" : "warning"} title="Webhooks" value={stats ? `${stats.webhookSuccessRate}%` : "-"} subtitle="Delivery success" />
      <WidgetCard icon="gmail" tone="accent" title="Gmail" value={stats ? stats.gmailCount ?? 0 : "-"} subtitle="Connected inboxes" />
    </div>
  );
}
