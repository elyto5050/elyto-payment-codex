"use client";

import { useQuery } from "@tanstack/react-query";
import apiFetch from "@/lib/api/client";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardCard } from "@/components/dashboard/card-components";
import { Button } from "@/components/ui/button";

export default function TutorialsPage() {
  const { data } = useQuery({ queryKey: ["tutorials"], queryFn: async () => (await apiFetch("/api/tutorials")) as { data: Array<any>; meta?: any } });

  const tutorials = data?.data ?? [];

  return (
    <div className="space-y-6">
      <DashboardHeader title="Tutorials" description="Guided walkthroughs to help you onboard and learn features quickly." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <DashboardCard title="Tutorials">
            <div className="space-y-3 p-4">
              {tutorials.length ? (
                tutorials.map((t: any) => (
                  <div key={t.id} className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{t.title}</p>
                        <p className="text-xs text-zinc-400 mt-1">{t.description}</p>
                      </div>
                      <div className="flex items-center">
                        <Button size="sm" variant="ghost">Open</Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-sm text-zinc-500">No tutorials available</div>
              )}
            </div>
          </DashboardCard>
        </div>
        <div className="h-fit">
          <DashboardCard title="Help & Guides">
            <div className="p-4 text-sm text-zinc-400">Short guides and tips to accelerate onboarding and troubleshooting.</div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
