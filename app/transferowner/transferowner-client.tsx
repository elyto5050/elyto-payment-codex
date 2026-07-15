"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import apiFetch from "@/lib/api/client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function TransferOwnerClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [targetEmail, setTargetEmail] = useState("");
  const [transferCode, setTransferCode] = useState("");

  const { data } = useQuery({
    queryKey: ["owner-transfer-status"],
    enabled: !token,
    queryFn: async () => (await apiFetch("/api/admin/ownership-transfer"))
  });

  const startTransfer = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/admin/ownership-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", targetEmail, transferCode })
      });
    }
  });

  const finalizeTransfer = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/admin/ownership-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finalize", token })
      });
    }
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.15),transparent_30%),linear-gradient(180deg,#050505_0%,#050505_100%)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex justify-center">
          <Logo size={48} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Transfer platform ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <p className="text-sm text-zinc-400">
                This route is intentionally hidden from navigation. Ownership changes only complete through the protected flow below.
              </p>
              <Input placeholder="Target owner email" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} />
              <Input
                type="password"
                placeholder="Secure transfer code"
                value={transferCode}
                onChange={(e) => setTransferCode(e.target.value)}
              />
              <Button className="w-full" disabled={!targetEmail || !transferCode || startTransfer.isPending} onClick={() => startTransfer.mutate()}>
                {startTransfer.isPending ? "Starting transfer..." : "Start secure transfer"}
              </Button>
              {startTransfer.data?.targetEmail ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  Verification email queued for {startTransfer.data.targetEmail}. The secure token is not shown or logged.
                  {!startTransfer.data?.emailSent ? (
                    <div className="mt-2 text-xs text-emerald-200">
                      Email sending is not configured in this environment. Configure Resend before using this in production.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Verification status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <StatusRow label="Current owner" value={token ? "Hidden during confirmation" : data?.ownerEmail ?? "Loading..."} />
              <StatusRow label="Transfer code" value={token ? "Already verified" : data?.hasTransferCode ? "Configured" : "Missing"} />
              <StatusRow label="Pending target" value={token ? "Signed-in target account required" : data?.pendingTransfer?.targetEmail ?? "None"} />
              <StatusRow label="Pending expiry" value={token ? "Validated during final confirmation" : data?.pendingTransfer?.expiresAt ? new Date(data.pendingTransfer.expiresAt).toLocaleString() : "None"} />

              {token ? (
                <Button className="w-full" disabled={finalizeTransfer.isPending} onClick={() => finalizeTransfer.mutate()}>
                  {finalizeTransfer.isPending ? "Finalizing transfer..." : "Finalize ownership transfer"}
                </Button>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
                  Final confirmation is only available when this page is opened with a valid verification token.
                </p>
              )}

              {finalizeTransfer.data?.ownerEmail ? (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                  Ownership transferred to {finalizeTransfer.data.ownerEmail}.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-100">{value}</p>
    </div>
  );
}
