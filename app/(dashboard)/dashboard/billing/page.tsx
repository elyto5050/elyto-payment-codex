"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiFetch from "@/lib/api/client";
import { CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-context";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, StatCard, DashboardCard } from "@/components/dashboard/card-components";

type PlanKey = string;
type BillingPayload = {
  subscription?: {
    plan: string;
    status: string;
    verificationLimit: number;
    verificationsUsed: number;
    currentPeriodEnd?: string | null;
  } | null;
  plans?: Record<string, { limit: number; label: string }>;
};

export default function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["billing"],
    queryFn: async () => (await apiFetch("/api/dashboard/billing")) as BillingPayload
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async (plan: string) => {
      return await apiFetch("/api/dashboard/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
    },
    onSuccess: async (data: any) => {
      if (data?.paymentRef) {
        const targetUPI = data.targetUPI ?? "aviralji@fam";
        const amount = data.amount ?? undefined;
        const promptMessage = amount ? `Pay ₹${amount} to ${targetUPI} then paste the UTR here:` : `Pay to ${targetUPI} then paste the UTR here:`;
        const utr = typeof window !== "undefined" ? window.prompt(promptMessage) : null;
        if (utr) {
          try {
            const submit = await apiFetch("/api/dashboard/billing/submit-utr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentRef: data.paymentRef, utr })
            });

            if (submit?.matched) {
              addToast("Subscription verified", "success");
              queryClient.invalidateQueries({ queryKey: ["billing"] });
              return;
            }

            addToast(submit?.message ?? "UTR submitted; awaiting confirmation", "info");
            queryClient.invalidateQueries({ queryKey: ["billing"] });
            return;
          } catch (err) {
            addToast("Failed to submit UTR", "error");
          }
        }
        addToast("Checkout started", "success");
        queryClient.invalidateQueries({ queryKey: ["billing"] });
        return;
      }

      addToast("Checkout started", "success");
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: () => addToast("Failed to start checkout", "error")
  });

  const sub = data?.subscription;
  const used = sub?.verificationsUsed ?? 0;
  const limit = sub?.verificationLimit ?? 500;
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const plans = data?.plans ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <DashboardHeader
            title="Billing & Usage"
            description="Manage your verification quota and plan"
          />
        </div>
        <Button className="gap-2 rounded-dense bg-cyan-600 hover:bg-cyan-700">
          <Sparkles className="h-4 w-4" /> Upgrade
        </Button>
      </div>

      {/* Metrics Grid */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Plan Status</p>
        <DashboardGrid columns={4}>
          <StatCard
            label="Current Plan"
            value={isLoading ? "—" : sub?.plan?.toLowerCase() ?? "starter"}
            trend="neutral"
          />
          <StatCard
            label="Usage"
            value={`${percent}%`}
            trend={percent > 80 ? "down" : "up"}
          />
          <StatCard
            label="Used This Period"
            value={used.toLocaleString()}
            unit={`of ${limit.toLocaleString()}`}
          />
          <StatCard
            label="Status"
            value={sub?.status?.toLowerCase() ?? "active"}
            trend={sub?.status === "active" ? "up" : "down"}
          />
        </DashboardGrid>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Usage Meter */}
          <DashboardCard title="Verification Usage" subtitle="Current billing period">
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-zinc-500">Quota Used</p>
                  <p className="text-2xl font-bold text-white">{used.toLocaleString()} / {limit.toLocaleString()}</p>
                </div>
                <span className={`rounded-dense px-2.5 py-1 text-xs font-semibold ${percent > 80 ? "bg-red-500/20 text-red-200" : "bg-cyan-500/20 text-cyan-200"}`}>
                  {percent}% used
                </span>
              </div>
              <div className="w-full h-2 rounded-dense bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-dense transition-all ${percent > 80 ? "bg-red-500" : "bg-gradient-to-r from-purple-500 to-cyan-500"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400">
                {percent === 100
                  ? "You've reached your quota limit"
                  : percent > 80
                    ? "You're approaching your quota limit"
                    : `${limit - used} verifications remaining`}
              </p>
            </div>
          </DashboardCard>

          {/* Plans Grid */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Available Plans</p>
            <div className="grid gap-3 md:grid-cols-3">
              {(Object.entries(plans) as Array<[PlanKey, { limit: number; label: string }]>).map(([key, plan]) => (
                <DashboardCard
                  key={key}
                  title={plan.label}
                  className={sub?.plan === key ? "border-cyan-400/30 bg-cyan-400/[0.03]" : ""}
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {plan.limit >= 999999 ? "Custom" : plan.limit.toLocaleString()}
                      </p>
                      <p className="text-xs text-zinc-500">verifications/period</p>
                    </div>
                    {sub?.plan === key && (
                      <div className="rounded-dense bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 text-center text-xs text-cyan-200 font-semibold">
                        ✓ Current plan
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full rounded-dense"
                      variant={sub?.plan === key ? "outline" : "default"}
                      disabled={sub?.plan === key || checkoutMutation.isPending}
                      onClick={() => checkoutMutation.mutate(key)}
                    >
                      {sub?.plan === key ? "Active" : checkoutMutation.isPending ? "Starting…" : "Upgrade"}
                    </Button>
                  </div>
                </DashboardCard>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 h-fit space-y-6">
          {/* Info Card */}
          <DashboardCard title="How it works">
            <div className="space-y-2 text-xs text-zinc-400">
              <p>✓ No payment capture</p>
              <p>✓ Pay only for usage</p>
              <p>✓ Auto-increment on verification</p>
              <p>✓ Contact support for limits</p>
            </div>
          </DashboardCard>

          {/* Quick Actions */}
          <DashboardCard title="Support">
            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full rounded-dense text-xs h-7">
                Contact support
              </Button>
              <Button size="sm" variant="outline" className="w-full rounded-dense text-xs h-7">
                View API docs
              </Button>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Invoices */}
      <DashboardCard title="Invoices & History" subtitle="Coming soon">
        <div className="py-8 text-center">
          <CreditCard className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Invoice and subscription management will appear here</p>
        </div>
      </DashboardCard>
    </div>
  );
}

