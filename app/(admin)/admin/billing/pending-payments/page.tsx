import React from "react";
import { headers } from "next/headers";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardCard } from "@/components/dashboard/card-components";

async function fetchPayments() {
  const res = await fetch("/api/admin/billing/pending-payments", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return json.payments as any[];
}

export default async function PendingPaymentsPage() {
  const payments = await fetchPayments();

  return (
    <div className="space-y-6">
      <DashboardHeader title="Pending Subscription Payments" description="Review and verify pending subscription payments." />

      <div className="grid gap-6">
        {payments.map((p) => (
          <DashboardCard key={p.id} title={`Payment ${p.paymentRef}`} subtitle={`${p.amount} ${p.currency}`}>
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">User: {p.userEmail}</p>
              <p className="text-sm text-zinc-300">Submitted UTR: {p.submittedUtr ?? "-"}</p>
              <p className="text-sm text-zinc-300">Submitted transaction: {p.submittedTransactionId ?? "-"}</p>
              <div className="flex gap-2 mt-3">
                <form action={`/api/admin/billing/pending-payments`} method="post">
                  <input type="hidden" name="paymentId" value={p.id} />
                  <input type="text" name="transactionHash" placeholder="Transaction ID" className="px-2 py-1 rounded-dense bg-white/5" />
                  <button className="ml-2 px-3 py-1 rounded-dense bg-cyan-600/20">Verify</button>
                </form>
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
