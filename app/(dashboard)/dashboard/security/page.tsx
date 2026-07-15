"use client";

import { useMemo, useState } from "react";
import apiFetch from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, KeyRound, LockKeyhole, MonitorSmartphone, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, StatCard, DashboardCard } from "@/components/dashboard/card-components";
import { useToast } from "@/components/ui/toast-context";

type LoginHistory = {
  id: string;
  success: boolean;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

type SecurityEvent = {
  id: string;
  type: string;
  severity: string;
  createdAt: string;
};

type SecurityPayload = {
  mfa?: { enabled: boolean };
  loginHistory?: LoginHistory[];
  securityEvents?: SecurityEvent[];
};

export default function SecurityPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaUri, setMfaUri] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["security"],
    queryFn: async () => (await apiFetch("/api/dashboard/security")) as SecurityPayload
  });

  const loginHistory = useMemo(() => data?.loginHistory?.slice(0, 5) ?? [], [data?.loginHistory]); // Last 5
  const securityEvents = useMemo(() => data?.securityEvents ?? [], [data?.securityEvents]);
  const failedLogins = data?.loginHistory?.filter((event) => !event.success).length ?? 0;
  const criticalEvents = securityEvents.filter((event) => event.severity === "CRITICAL").length;
  const riskScore = Math.max(0, 100 - failedLogins * 8 - criticalEvents * 15 - (data?.mfa?.enabled ? 0 : 20));

  const setupMfa = useMutation({
    mutationFn: async () => (await apiFetch("/api/dashboard/security/mfa")),
    onSuccess: (result: any) => {
      setMfaSecret(result.secret);
      setMfaUri(result.uri);
    },
    onError: () => addToast("Failed to setup MFA", "error")
  });

  const enableMfa = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/dashboard/security/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", secret: mfaSecret, code: mfaCode })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security"] });
      setMfaSecret("");
      setMfaCode("");
      setMfaUri("");
      addToast("MFA enabled successfully", "success");
    },
    onError: () => addToast("Invalid code or setup failed", "error")
  });

  return (
    <div className="space-y-6">
      <div>
        <DashboardHeader
          title="Security"
          description="MFA, login history, events, and account risk"
        />

        {/* Metrics Grid */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Account Status</p>
          <DashboardGrid columns={4}>
            <StatCard
              label="MFA Status"
              value={data?.mfa?.enabled ? "Enabled" : "Disabled"}
              trend={data?.mfa?.enabled ? "up" : "down"}
              trendLabel={data?.mfa?.enabled ? "Protected" : "Not protected"}
            />
            <StatCard label="Total Logins" value={data?.loginHistory?.length ?? 0} unit="logins" />
            <StatCard label="Failed Attempts" value={failedLogins} unit={failedLogins ? "concerning" : "healthy"} trend={failedLogins > 0 ? "down" : "up"} />
            <StatCard label="Risk Score" value={`${riskScore}%`} trend={riskScore >= 80 ? "up" : "down"} />
          </DashboardGrid>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Login History */}
          <DashboardCard title="Login History" subtitle="Last 5 logins">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-sm text-zinc-500 py-8">Loading...</div>
              ) : loginHistory.length ? (
                loginHistory.map((event) => (
                  <LoginRow key={event.id} event={event} />
                ))
              ) : (
                <div className="text-center py-8 text-sm text-zinc-500">No login history yet</div>
              )}
            </div>
          </DashboardCard>

          {/* Security Events */}
          {securityEvents.length > 0 && (
            <DashboardCard title="Security Events" subtitle={`${securityEvents.length} event${securityEvents.length !== 1 ? "s" : ""}`}>
              <div className="space-y-2">
                {securityEvents.map((event) => (
                  <SecurityEventRow key={event.id} event={event} />
                ))}
              </div>
            </DashboardCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 h-fit">
          {/* MFA Setup */}
          <DashboardCard title="Two-Factor Auth">
            <div className="space-y-3">
              <div className={`rounded-dense border p-3 text-xs ${data?.mfa?.enabled ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
                <p className="font-semibold text-white">{data?.mfa?.enabled ? "✓ MFA Enabled" : "⚠ MFA Disabled"}</p>
                <p className="text-zinc-400 mt-1">Protect your account with 2FA</p>
              </div>

              {!data?.mfa?.enabled ? (
                <>
                  <Button
                    className="w-full rounded-dense bg-cyan-600 hover:bg-cyan-700"
                    disabled={setupMfa.isPending}
                    onClick={() => setupMfa.mutate()}
                  >
                    {setupMfa.isPending ? "Preparing..." : "Setup MFA"}
                  </Button>

                  {mfaUri && (
                    <div className="space-y-2 rounded-dense border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-xs text-zinc-500">Scan or enter code:</p>
                      <code className="block break-all rounded-dense bg-black/25 p-2 font-mono text-[10px] text-zinc-300">
                        {mfaSecret}
                      </code>
                      <Input
                        placeholder="000000"
                        value={mfaCode}
                        onChange={(event) => setMfaCode(event.target.value)}
                        maxLength={6}
                        className="text-sm text-center text-xl tracking-widest"
                      />
                      <Button
                        size="sm"
                        className="w-full rounded-dense"
                        disabled={!mfaCode || enableMfa.isPending}
                        onClick={() => enableMfa.mutate()}
                      >
                        {enableMfa.isPending ? "Verifying..." : "Verify & Enable"}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-xs text-zinc-500">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p>Your account is protected</p>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Risk Indicator */}
          <DashboardCard title="Risk Assessment">
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{riskScore}%</p>
                <p className="text-xs text-zinc-500 mt-1">Account Risk Score</p>
              </div>
              <div className="w-full h-2 rounded-dense bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-dense transition-all ${riskScore >= 80 ? "bg-emerald-500" : riskScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400">
                {riskScore >= 80 ? "✓ Low risk - good security" : riskScore >= 60 ? "⚠ Medium risk" : "⛔ High risk - enable MFA"}
              </p>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

function LoginRow({ event }: { event: LoginHistory }) {
  return (
    <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors flex items-center gap-2">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-dense border text-xs ${event.success ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>
        {event.success ? "✓" : "✕"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-white">{event.reason || "login"}</p>
        <p className="truncate text-xs text-zinc-500">{event.ipAddress || "Unknown"} · {event.userAgent ? event.userAgent.split(" ").slice(0, 2).join(" ") : "Unknown"}</p>
      </div>
      <p className="text-xs text-zinc-500 flex-shrink-0">{new Date(event.createdAt).toLocaleDateString()}</p>
    </div>
  );
}

function SecurityEventRow({ event }: { event: SecurityEvent }) {
  const critical = event.severity === "CRITICAL";
  return (
    <div className={`rounded-dense border p-3 flex items-center gap-2 ${critical ? "bg-red-500/10 border-red-500/30" : "bg-white/[0.02] border-white/10"}`}>
      <KeyRound className={`h-4 w-4 flex-shrink-0 ${critical ? "text-red-400" : "text-cyan-400"}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-white">{event.type}</p>
        <p className="text-xs text-zinc-500">{event.severity.toLowerCase()}</p>
      </div>
      <p className="text-xs text-zinc-500 flex-shrink-0">{new Date(event.createdAt).toLocaleDateString()}</p>
    </div>
  );
}
