"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, DashboardCard, StatCard } from "@/components/dashboard/card-components";
import { DenseTable, TablePagination } from "@/components/dashboard/dense-table";
import { useState } from "react";

/**
 * Overview page demonstrating high-density dashboard layout
 * - Compact plan badge in header
 * - Grid-based KPI stat cards
 * - Dense transaction table with 36px rows
 * - Micro-typography throughout
 */
export function DashboardOverview() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Mock data for demonstration
  const mockOrders = Array.from({ length: 25 }, (_, i) => ({
    id: `ORD-${String(i + 1).padStart(5, "0")}`,
    customer: `customer${i + 1}@example.com`,
    amount: `₹${(Math.random() * 5000 + 100).toFixed(0)}`,
    status: ["Verified", "Pending", "Failed"][i % 3],
    date: new Date(Date.now() - i * 86400000).toLocaleDateString("en-IN"),
    utr: `UTR${String(i + 1).padStart(8, "0")}`,
  }));

  const paginatedOrders = mockOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header with Plan Badge */}
      <DashboardHeader
        title="Overview"
        description="Payments, verifications, and platform metrics"
        planBadge={{
          label: "Free Sandbox",
          variant: "default",
        }}
      />

      {/* KPI Stats Grid */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Key Metrics</p>
        <DashboardGrid columns={4}>
          <StatCard
            label="Total Verified"
            value={42}
            unit="payments"
            trend="up"
            trendLabel="↑ 12% this month"
          />
          <StatCard
            label="Pending"
            value={8}
            unit="orders"
            trend="neutral"
            trendLabel="Awaiting verification"
          />
          <StatCard
            label="Success Rate"
            value="95.2%"
            trend="up"
            trendLabel="↑ 2.1% vs last month"
          />
          <StatCard
            label="Gmail Sync"
            value="Healthy"
            trend="up"
            trendLabel="Last sync: 2min ago"
          />
        </DashboardGrid>
      </div>

      {/* Recent Transactions */}
      <DashboardCard
        title="Recent Orders"
        subtitle={`Showing ${paginatedOrders.length} of ${mockOrders.length} transactions`}
      >
        <div className="space-y-3">
          {/* Dense Table */}
          <DenseTable
            columns={[
              { key: "id", label: "Order ID", width: "w-24" },
              { key: "customer", label: "Customer", width: "flex-1" },
              { key: "amount", label: "Amount", width: "w-20" },
              {
                key: "status",
                label: "Status",
                width: "w-20",
                render: (value) => (
                  <span
                    className={`px-2 py-0.5 rounded-dense text-[10px] font-semibold ${
                      String(value) === "Verified"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : String(value) === "Pending"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {String(value)}
                  </span>
                ),
              },
              { key: "date", label: "Date", width: "w-20" },
              { key: "utr", label: "UTR", width: "w-24" },
            ]}
            data={paginatedOrders}
            keyField="id"
            rowHeight="h-9"
          />

          {/* Pagination */}
          <TablePagination
            current={currentPage}
            total={mockOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </DashboardCard>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-dense-lg">
        <DashboardCard title="Webhook Delivery">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-400">Success Rate</p>
              <p className="text-sm font-semibold text-emerald-400">99.8%</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-400">Avg Response Time</p>
              <p className="text-sm font-semibold text-white">124ms</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-400">Failed Events (24h)</p>
              <p className="text-sm font-semibold text-white">2</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="API Activity">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-400">Requests Today</p>
              <p className="text-sm font-semibold text-white">1,234</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-400">Avg Response Time</p>
              <p className="text-sm font-semibold text-white">89ms</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-400">Error Rate</p>
              <p className="text-sm font-semibold text-emerald-400">0.02%</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
