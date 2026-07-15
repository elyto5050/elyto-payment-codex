"use client";

import { cn } from "@/lib/utils";
import { PlanKey, PLANS } from "@/lib/plans";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "premium" | "enterprise" | "success" | "warning" | "error";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-white/10 border-white/20 text-white",
    premium: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    enterprise: "bg-purple-500/10 border-purple-500/20 text-purple-300",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
    error: "bg-red-500/10 border-red-500/20 text-red-300"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-dense border text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Status badge for displaying verification, payment, and order statuses
 */
export function StatusBadge({
  status,
  className
}: {
  status: "verified" | "pending" | "failed" | "processing";
  className?: string;
}) {
  const statusConfig: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    verified: { label: "Verified", variant: "success" },
    pending: { label: "Pending", variant: "warning" },
    failed: { label: "Failed", variant: "error" },
    processing: { label: "Processing", variant: "default" }
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

/**
 * Plan badge for displaying subscription tier
 */
export function PlanBadge({
  plan,
  className
}: {
  plan: PlanKey;
  className?: string;
}) {
  const planDef = PLANS[plan];
  const variant: BadgeProps["variant"] = plan === "ENTERPRISE" ? "enterprise" : plan === "FREE" ? "default" : "premium";

  return (
    <Badge variant={variant} className={className}>
      {planDef?.name ?? plan}
    </Badge>
  );
}
