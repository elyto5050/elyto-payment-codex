"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock3, Mail, ReceiptText, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationTimeline } from "@/components/dashboard/verification-timeline";
import { formatCurrency } from "@/lib/utils";

type OrderDetail = {
  publicId: string;
  amount: string;
  currency: string;
  status: string;
  customerName?: string | null;
  customerEmail?: string | null;
  submittedUtr?: string | null;
  failureReason?: string | null;
  createdAt?: string;
  verifiedAt?: string | null;
  failedAt?: string | null;
  expiresAt?: string | null;
  product?: string;
  project?: string;
};

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    }
  });

  const order = data?.data as OrderDetail | undefined;

  if (isLoading) return <div className="h-72 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.03]" />;
  if (!order) return <p className="text-sm text-zinc-500">Order not found.</p>;

  const paid = ["VERIFIED", "PAID"].includes(order.status);
  const failed = ["FAILED", "EXPIRED", "CANCELLED"].includes(order.status);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Order</p>
            <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight text-white">{order.publicId}</h1>
            <p className="mt-2 text-sm text-zinc-400">{order.project ?? "Project"} - {order.product ?? "Direct checkout"}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<ReceiptText className="h-4 w-4" />} label="Amount" value={formatCurrency(order.amount, order.currency)} />
        <Metric icon={paid ? <CheckCircle2 className="h-4 w-4" /> : failed ? <XCircle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />} label="Status" value={order.status.toLowerCase()} />
        <Metric icon={<ShieldCheck className="h-4 w-4" />} label="UTR" value={order.submittedUtr ?? "Waiting"} />
        <Metric icon={<CalendarDays className="h-4 w-4" />} label="Created" value={order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <Info label="Product" value={order.product ?? "-"} />
              <Info label="Project" value={order.project ?? "-"} />
              <Info label="Submitted UTR" value={order.submittedUtr ?? "Not submitted"} />
              <Info label="Failure reason" value={order.failureReason ?? "None"} />
              <Info label="Verified at" value={order.verifiedAt ? new Date(order.verifiedAt).toLocaleString() : "-"} />
              <Info label="Expires at" value={order.expiresAt ? new Date(order.expiresAt).toLocaleString() : "-"} />
            </CardContent>
          </Card>

          <VerificationTimeline orderId={orderId} />
        </div>

        <Card className="h-fit">
          <CardHeader className="border-b border-border">
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{order.customerName ?? "Unknown customer"}</p>
                <p className="mt-1 truncate text-xs text-zinc-500">{order.customerEmail ?? "No email"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="flex items-center gap-2 text-sm text-zinc-300"><Mail className="h-4 w-4 text-cyan-200" /> Notification status</p>
              <p className="mt-1 text-sm text-zinc-500">Customer email events are sent by verification workflows.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const paid = ["VERIFIED", "PAID"].includes(status);
  const failed = ["FAILED", "EXPIRED", "CANCELLED"].includes(status);
  return <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${paid ? "bg-emerald-500/10 text-emerald-300" : failed ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-300"}`}>{status.toLowerCase()}</span>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
          <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-sm text-zinc-100">{value}</p>
    </div>
  );
}
