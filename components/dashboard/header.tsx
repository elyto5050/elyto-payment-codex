"use client";

import { Badge } from "@/components/ui/badge";

export function DashboardHeader({
  title,
  description,
  planBadge,
  actions,
}: {
  title: string;
  description?: string;
  planBadge?: { label: string; variant?: "default" | "premium" | "enterprise" };
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-base font-semibold text-white truncate">{title}</h1>
          {planBadge && (
            <Badge
              variant={planBadge.variant || "default"}
              className="text-[10px] px-2 py-0.5"
            >
              {planBadge.label}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-sm text-zinc-400 truncate">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
