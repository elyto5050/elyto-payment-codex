"use client";

import { cn } from "@/lib/utils";

/**
 * High-density card component for dashboard views
 * - Max width prevents oversizing on high-resolution screens
 * - Fixed 16px padding globally
 * - 8px border radius for consistency
 */
export function DashboardCard({
  children,
  className,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[8px] bg-white/[0.02] border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      {(title || subtitle) && (
        <div className="px-4 py-3 border-b border-white/10">
          {title && <p className="text-[16px] font-semibold text-white">{title}</p>}
          {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

/**
 * High-density stat card for KPI displays
 * Uses clean numeric metrics without oversized boxes
 */
export function StatCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}) {
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-500";

  return (
    <div className="p-4 rounded-[8px] bg-white/[0.02] border border-white/10">
      <p className="text-sm text-zinc-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-[16px] font-semibold text-white">{value}</p>
        {unit && <p className="text-sm text-zinc-500">{unit}</p>}
      </div>
      {trendLabel && (
        <p className={`text-sm mt-2 ${trendColor}`}>{trendLabel}</p>
      )}
    </div>
  );
}

/**
 * Grid layout for dashboard cards
 * Enforces high-density spacing and prevents oversizing
 */
export function DashboardGrid({
  children,
  columns = 3,
  gap = "gap-dense-lg",
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: string;
}) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={`grid ${colClass} ${gap}`}>
      {children}
    </div>
  );
}
