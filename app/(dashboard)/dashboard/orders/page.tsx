"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, FileText, Search, ShieldCheck, TimerReset, XCircle } from "lucide-react";
import apiFetch from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, StatCard, DashboardCard } from "@/components/dashboard/card-components";
import { DenseTable, TablePagination } from "@/components/dashboard/dense-table";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Order = {
  id?: string;
  publicId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  project: { name: string };
  product?: { name: string } | null;
  amount: string;
  currency?: string;
  submittedUtr?: string | null;
  status: string;
  createdAt?: string;
  verifiedAt?: string | null;
  failedAt?: string | null;
};

type StatusFilter = "all" | "pending" | "verified" | "failed";

export default function OrdersPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  type OrdersResponse = { data: Order[]; meta?: { total?: number; page?: number; pageSize?: number; totalPages?: number } };
  const { data: paged, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["orders", page, pageSize],
    queryFn: async () => (await apiFetch(`/api/dashboard/orders?page=${page}&pageSize=${pageSize}`)) as OrdersResponse,
    staleTime: 15000,
    retry: 1
  });

  const list = useMemo<Order[]>(() => paged?.data ?? [], [paged]);
  const total = paged?.meta?.total ?? 0;
  const totalPages = paged?.meta?.totalPages ?? 1;

  const debouncedQuery = useDebouncedValue(query, 350);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return list.filter((order: Order) => {
      const statusMatch =
        status === "all" ||
        (status === "verified" && ["VERIFIED", "PAID"].includes(order.status)) ||
        (status === "failed" && ["FAILED", "EXPIRED", "CANCELLED"].includes(order.status)) ||
        (status === "pending" && !["VERIFIED", "PAID", "FAILED", "EXPIRED", "CANCELLED"].includes(order.status));

      if (!statusMatch) return false;
      if (!q) return true;
      return `${order.publicId} ${order.customerEmail ?? ""} ${order.customerName ?? ""} ${order.project.name} ${order.product?.name ?? ""} ${order.submittedUtr ?? ""}`.toLowerCase().includes(q);
    });
  }, [list, debouncedQuery, status]);

  const { data: statsResp } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await apiFetch("/api/dashboard/stats"))
  });

  const metrics = useMemo(() => {
    const stats = statsResp?.stats ?? { totalOrders: 0, paidOrders: 0, failedOrders: 0, revenue: 0, verificationRate: 0 };
    return {
      total: stats.totalOrders ?? 0,
      paid: stats.paidOrders ?? 0,
      failed: stats.failedOrders ?? 0,
      pending: (stats.totalOrders ?? 0) - (stats.paidOrders ?? 0) - (stats.failedOrders ?? 0),
      revenue: stats.revenue ?? 0,
      verificationRate: stats.verificationRate ?? 0
    };
  }, [statsResp]);

  function exportCsv() {
    const rows = [
      ["Order", "Customer", "Project", "Product", "Amount", "UTR", "Status", "Created"],
      ...filtered.map((order: Order) => [
        order.publicId,
        order.customerEmail ?? order.customerName ?? "",
        order.project.name,
        order.product?.name ?? "",
        String(order.amount),
        order.submittedUtr ?? "",
        order.status,
        order.createdAt ?? ""
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "elyto-orders.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header with Metrics Grid */}
      <DashboardHeader
        title="Orders"
        description="Payment verification, delivery status, and transaction history"
      />

      {/* KPI Stats Grid */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Key Metrics</p>
        <DashboardGrid columns={4}>
          <StatCard
            label="Total Revenue"
            value={formatCurrency(metrics.revenue)}
            trend="up"
            trendLabel={`+${Math.round((metrics.paid / Math.max(metrics.total, 1)) * 100)}% verified`}
          />
          <StatCard
            label="Total Orders"
            value={metrics.total}
            unit="orders"
            trend="up"
          />
          <StatCard
            label="Verified"
            value={`${metrics.verificationRate}%`}
            trend="up"
            trendLabel={`${metrics.paid} complete`}
          />
          <StatCard
            label="Pending Review"
            value={metrics.failed}
            unit="orders"
            trend="neutral"
            trendLabel="Require action"
          />
        </DashboardGrid>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CompactStat icon={<ShieldCheck className="h-4 w-4" />} label="Verification" value={`${metrics.paid} complete`} />
        <CompactStat icon={<TimerReset className="h-4 w-4" />} label="Pending" value={`${metrics.pending} waiting`} />
        <CompactStat icon={<XCircle className="h-4 w-4" />} label="Failed" value={`${metrics.failed} require review`} />
      </div>

      {/* Orders Table */}
      <DashboardCard title="Order Management" subtitle={`Showing ${filtered.length} of ${total} orders`}>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                className="pl-9 text-sm"
                placeholder="Search orders, UTRs, customers"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-dense border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-300 hover:bg-white/[0.05]"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="failed">Failed</option>
            </select>
            <Button variant="outline" size="sm" className="gap-2 rounded-dense" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>

          {/* Dense Table */}
          {isLoading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading orders...</div>
            ) : filtered.length ? (
            <>
              <DenseTable
              columns={[
                { key: "publicId", label: "Order ID", width: "w-24" },
                { key: "customerEmail", label: "Customer", width: "flex-1" },
                { key: "product", label: "Product", width: "w-32", render: (_, row) => ((row as Order).product?.name) || "Direct" },
                { key: "amount", label: "Amount", width: "w-20" },
                {
                  key: "status",
                  label: "Status",
                  width: "w-20",
                  render: (value: unknown) => {
                    const status = String(value);
                    return (
                      <span
                        className={`px-2 py-0.5 rounded-dense text-[10px] font-semibold ${
                          ["VERIFIED", "PAID"].includes(status)
                            ? "bg-emerald-500/20 text-emerald-300"
                            : ["FAILED", "EXPIRED", "CANCELLED"].includes(status)
                              ? "bg-red-500/20 text-red-300"
                              : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {status.toLowerCase()}
                      </span>
                    );
                  }
                },
                { key: "createdAt", label: "Date", width: "w-24", render: (value: unknown) => {
                    if (!value) return "-";
                    if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
                      return new Date(value as string | number | Date).toLocaleDateString();
                    }
                    return String(value);
                  } },
                {
                  key: "publicId",
                  label: "Action",
                  width: "w-16",
                  render: (_, row) => (
                    <Link href={`/dashboard/orders/${row.publicId}`}>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )
                }
              ]}
              data={filtered}
              keyField="publicId"
              rowHeight="h-9"
              />

              {/* Pagination */}
              {total > 0 && (
                <TablePagination current={page} total={total} pageSize={pageSize} onPageChange={(p) => setPage(p)} />
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">No orders found</p>
              <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}

function CompactStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-dense bg-white/[0.02] border border-white/10 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-dense border border-white/10 bg-white/[0.05] text-cyan-200 flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
