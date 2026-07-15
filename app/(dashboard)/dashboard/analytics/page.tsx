"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import apiFetch from "@/lib/api/client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActivitySquare, RadioTower, ShieldCheck, Zap } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, StatCard, DashboardCard } from "@/components/dashboard/card-components";
import { formatCurrency } from "@/lib/utils";

type DailyPoint = {
  date: string;
  revenue: number;
  orders: number;
  paid: number;
};

type AnalyticsPayload = {
  summary?: {
    revenue: number;
    orders: number;
    paidOrders: number;
    failedOrders: number;
    verificationRate: number;
    webhookSuccessRate: number;
    activeProjects: number;
  };
  daily?: DailyPoint[];
};

const tooltipStyle = {
  background: "#0B0B0F",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 12,
  color: "#fff"
};

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await apiFetch("/api/dashboard/analytics")) as AnalyticsPayload
  });

  const summary = data?.summary;
  const daily = useMemo(() => data?.daily ?? [], [data?.daily]);
  const healthScore = Math.round(((summary?.verificationRate ?? 0) + (summary?.webhookSuccessRate ?? 100)) / 2);

  const peak = useMemo(() => {
    if (!daily.length) return { revenue: 0, orders: 0 };
    return daily.reduce(
      (acc, point) => ({
        revenue: Math.max(acc.revenue, point.revenue),
        orders: Math.max(acc.orders, point.orders)
      }),
      { revenue: 0, orders: 0 }
    );
  }, [daily]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Analytics"
        description="Revenue, orders, verification quality, and webhook performance"
      />

      {/* Metrics Grid */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Performance Metrics</p>
        <DashboardGrid columns={4}>
          <StatCard
            label="Total Revenue"
            value={summary ? formatCurrency(summary.revenue) : "—"}
            trend={summary && summary.revenue > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Total Orders"
            value={summary?.orders ?? "—"}
            unit={`${summary?.paidOrders ?? 0} paid`}
          />
          <StatCard
            label="Verification Rate"
            value={summary ? `${summary.verificationRate}%` : "—"}
            trend={(summary?.verificationRate ?? 0) >= 85 ? "up" : "down"}
            trendLabel={`${summary?.failedOrders ?? 0} failed`}
          />
          <StatCard
            label="Webhook Health"
            value={summary ? `${summary.webhookSuccessRate}%` : "—"}
            trend={(summary?.webhookSuccessRate ?? 100) >= 85 ? "up" : "down"}
            trendLabel={`${summary?.activeProjects ?? 0} projects`}
          />
        </DashboardGrid>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Charts */}
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardCard title="Revenue Trend" subtitle={`Peak: ${formatCurrency(peak.revenue)}`}>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 9 }} tickFormatter={(value) => value.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0B0B0F", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "#fff" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#06B6D4" strokeWidth={2} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </DashboardCard>

            <DashboardCard title="Orders Mix" subtitle={`Peak: ${peak.orders} orders`}>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 9 }} tickFormatter={(value) => value.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0B0B0F", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "#fff" }} />
                    <Bar dataKey="orders" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paid" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashboardCard>
          </div>

          <DashboardCard title="Paid Order Momentum" subtitle="Paid orders vs total volume">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 9 }} tickFormatter={(value) => value.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0B0B0F", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "#fff" }} />
                  <Line type="monotone" dataKey="orders" stroke="#71717a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="paid" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </div>

        {/* Sidebar - Signals & Health */}
        <div className="lg:sticky lg:top-24 h-fit space-y-6">
          {/* Health Score */}
          <DashboardCard title="Health Score">
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{isLoading ? "—" : `${healthScore}%`}</p>
                <p className="text-xs text-zinc-500 mt-1">System health</p>
              </div>
              <div className="w-full h-2 rounded-dense bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-dense bg-gradient-to-r from-purple-500 to-emerald-500"
                  style={{ width: `${Math.max(0, Math.min(100, healthScore))}%` }}
                />
              </div>
            </div>
          </DashboardCard>

          {/* Operational Signals */}
          <DashboardCard title="Signals">
            <div className="space-y-2">
              <OperationalSignal
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Verification"
                value={`${summary?.verificationRate ?? 0}%`}
              />
              <OperationalSignal
                icon={<RadioTower className="h-4 w-4" />}
                label="Webhooks"
                value={`${summary?.webhookSuccessRate ?? 0}%`}
              />
              <OperationalSignal
                icon={<ActivitySquare className="h-4 w-4" />}
                label="Active Projects"
                value={summary?.activeProjects ?? 0}
              />
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

function OperationalSignal({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-dense bg-white/[0.02] border border-white/10 p-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-dense bg-white/[0.05] text-cyan-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-zinc-500">{label}</p>
        <p className="truncate text-xs font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
