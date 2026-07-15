"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, XCircle } from "lucide-react";

type TimelineEvent = {
  type: string;
  timestamp: string;
  title: string;
  description: string;
  status: "completed" | "pending" | "failed";
};

export function VerificationTimeline({ orderId }: { orderId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["verification-timeline", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/orders/${orderId}/verification-timeline`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    }
  });

  const timeline = data?.data?.timeline ?? [];
  const order = data?.data?.order;

  if (error) {
    return (
      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardContent className="pt-6">
          <p className="text-sm text-rose-400">Failed to load verification timeline</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Verification Timeline</CardTitle>
        {order && (
          <p className="text-xs text-zinc-400 mt-2">
            Order {order.publicId} • {order.product}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <p className="text-sm text-zinc-500">No verification events yet</p>
        ) : (
          <div className="space-y-0">
            {timeline.map((event: TimelineEvent, index: number) => (
              <div key={event.type} className="flex gap-4 pb-6 relative">
                {/* Timeline line */}
                {index < timeline.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-[calc(100%_+_1.5rem)] bg-border" />
                )}

                {/* Event icon */}
                <div className="flex-shrink-0 relative z-10">
                  {event.status === "completed" && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}
                  {event.status === "pending" && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                  )}
                  {event.status === "failed" && (
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-rose-400" />
                    </div>
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{event.title}</p>
                      <p className="text-xs text-zinc-400 mt-1">{event.description}</p>
                    </div>
                    <span className="text-xs text-zinc-500 flex-shrink-0 whitespace-nowrap ml-2">
                      {formatTimeAgo(new Date(event.timestamp))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
