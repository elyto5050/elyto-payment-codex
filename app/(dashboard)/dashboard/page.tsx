"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Clock3, Copy, MailCheck, RadioTower, ReceiptText, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import WidgetsRow from "@/components/dashboard/widgets";
import ActivityFeed from "@/components/dashboard/activity-feed";
import GmailStatus from "@/components/dashboard/gmail-status";
import WebhookHealth from "@/components/dashboard/webhook-health";
import { OnboardingChecklist } from "@/components/dashboard/onboarding";
import { DashboardGrid, StatCard } from "@/components/dashboard/card-components";

async function fetchStats() {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  const res = await fetch("/api/dashboard/stats");
  const dur = typeof performance !== "undefined" ? performance.now() - start : Date.now() - start;
  // Client-side timing log
  // eslint-disable-next-line no-console
  console.info(`[trace] client GET /api/dashboard/stats ${Math.round(dur)}ms`);
  const serverTiming = res.headers?.get ? res.headers.get("Server-Timing") : null;
  if (serverTiming) {
    // eslint-disable-next-line no-console
    console.info(`[trace] server-timing: ${serverTiming}`);
  }
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

type RecentOrder = {
  publicId: string;
  product?: { name: string } | null;
  amount: string;
  status: string;
  createdAt?: string;
};

const chartBars = [34, 52, 46, 68, 58, 74, 63, 86, 78, 92, 84, 96];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });

  const stats = data?.data?.stats;
  const orders = (data?.data?.recentOrders ?? []) as RecentOrder[];
  const verificationRate = typeof stats?.verificationRate === "number" ? stats.verificationRate : 0;
  const webhookSuccessRate = typeof stats?.webhookSuccessRate === "number" ? stats.webhookSuccessRate : 0;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.11),rgba(255,255,255,0.03))] shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
        <div className="relative grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(6,182,212,0.22),transparent_28%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
              Live payment operations
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Your verification stack is running.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
              Revenue, orders, Gmail sync, webhook delivery, and verification health in one operational command view.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <HeroStat icon={<TrendingUp className="h-4 w-4" />} label="Revenue" value={stats ? formatCurrency(stats.revenue) : "-"} />
              <HeroStat icon={<ReceiptText className="h-4 w-4" />} label="Orders" value={stats?.totalOrders ?? "-"} />
              <HeroStat icon={<CheckCircle2 className="h-4 w-4" />} label="Verification" value={stats ? `${stats.verificationRate}%` : "-"} />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dashboard/projects">
                <Button className="gap-2 rounded-2xl">
                  Create project <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/orders">
                <Button variant="outline" className="gap-2 rounded-2xl">
                  Review orders <ReceiptText className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Revenue pulse</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stats ? formatCurrency(stats.revenue) : "-"}</p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">Live</span>
            </div>
            <div className="mt-6 flex h-36 items-end gap-2">
              {chartBars.map((height, index) => (
                <div key={index} className="flex flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-[linear-gradient(180deg,rgba(34,211,238,0.9),rgba(124,58,237,0.45))] shadow-[0_0_24px_rgba(6,182,212,0.16)]"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <HealthTile icon={<MailCheck className="h-4 w-4" />} label="Gmail health" value={`${stats?.gmailCount ?? 0} connected`} tone="accent" />
              <HealthTile icon={<RadioTower className="h-4 w-4" />} label="Webhook health" value={`${webhookSuccessRate}% success`} tone={webhookSuccessRate >= 85 ? "success" : "warning"} />
            </div>
          </div>
        </div>
      </section>

        {/* Compact KPI strip: current plan, small KPI cards, quick actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Current Plan</p>
              <p className="text-sm text-zinc-400">{stats?.planName ?? "Free Sandbox"}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/projects">
                <Button className="gap-2 rounded-md px-3 py-2 text-sm">New Project</Button>
              </Link>
              <Link href="/dashboard/orders">
                <Button variant="outline" className="gap-2 rounded-md px-3 py-2 text-sm">Review Orders</Button>
              </Link>
            </div>
          </div>

          <DashboardGrid columns={4} gap="gap-3">
            <StatCard label="Revenue" value={stats ? formatCurrency(stats.revenue) : "-"} />
            <StatCard label="Orders" value={stats?.totalOrders ?? "-"} />
            <StatCard label="Verification" value={stats ? `${stats.verificationRate}%` : "-"} />
            <StatCard label="Webhook Success" value={`${webhookSuccessRate}%`} />
          </DashboardGrid>
        </div>

      <WidgetsRow
        stats={{
          revenueDisplay: stats ? formatCurrency(stats.revenue) : "-",
          totalOrders: stats?.totalOrders ?? "-",
          verificationRate: stats?.verificationRate ?? "-",
          activeProjects: stats?.activeProjects ?? "-",
          webhookSuccessRate: stats?.webhookSuccessRate ?? "-",
          gmailCount: stats?.gmailCount ?? 0
        }}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <OnboardingChecklist completedSteps={["project", "product"]} />

          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Recent orders</CardTitle>
                  <p className="mt-1 text-sm text-zinc-500">Newest payment intents and verification states.</p>
                </div>
                <Link href="/dashboard/orders">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-zinc-500">Orders will appear here after checkout creation.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map((order) => (
                    <div key={order.publicId} className="grid gap-3 p-4 transition-colors hover:bg-white/[0.025] md:grid-cols-[1fr_160px_120px] md:items-center">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-mono text-xs text-zinc-400">{order.publicId}</p>
                          <Copy className="h-3.5 w-3.5 text-zinc-600" />
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-white">{order.product?.name ?? "Direct checkout"}</p>
                      </div>
                      <div className="font-medium text-white">{formatCurrency(order.amount)}</div>
                      <OrderStatus status={order.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <ActivityFeed />
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">System health</p>
              <HealthProgress label="Verification" value={verificationRate} />
              <HealthProgress label="Webhooks" value={webhookSuccessRate} />
              <HealthProgress label="Project readiness" value={stats?.activeProjects ? 100 : 0} />
            </CardContent>
          </Card>
          <GmailStatus />
          <WebhookHealth />
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <p className="text-[11px] uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function HealthTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "accent" | "success" | "warning" }) {
  const colors = {
    accent: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-200"
  };

  return (
    <div className={`rounded-2xl border p-4 ${colors[tone]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  );
}

function HealthProgress({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="text-zinc-500">{clamped}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#06B6D4)]" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const paid = status === "VERIFIED" || status === "PAID";
  const failed = status === "FAILED" || status === "EXPIRED" || status === "CANCELLED";

  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${paid ? "bg-emerald-500/10 text-emerald-300" : failed ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-300"}`}>
      {paid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
      {normalized}
    </span>
  );
}
