"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    id: "project",
    title: "Create your first project",
    description: "Organize your payment flows by project",
    href: "/dashboard/projects",
    icon: "📦"
  },
  {
    id: "product",
    title: "Add products or services",
    description: "Define what customers will pay for",
    href: "/dashboard/products",
    icon: "🛍️"
  },
  {
    id: "gmail",
    title: "Connect your Gmail account",
    description: "Enable automatic payment verification",
    href: "/dashboard/settings",
    icon: "📧"
  },
  {
    id: "checkout",
    title: "Create a checkout link",
    description: "Start accepting payments",
    href: "/dashboard/orders",
    icon: "💳"
  }
];

export function OnboardingChecklist({ completedSteps }: { completedSteps?: string[] }) {
  const completed = completedSteps ?? [];
  const progressPercent = Math.round((completed.length / steps.length) * 100);
  const [dismissed, setDismissed] = useState(false);

  // Respect local dismissal
  useEffect(() => {
    try {
      const v = localStorage.getItem("elyto.onboarding.dismissed");
      if (v === "1") setDismissed(true);
    } catch {}
  }, []);

  function handleDismiss() {
    try {
      localStorage.setItem("elyto.onboarding.dismissed", "1");
    } catch {}
    setDismissed(true);
  }

  if (dismissed || completed.length === steps.length) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Get started with Elyto</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-400">{completed.length} of {steps.length} complete</span>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>Dismiss</Button>
          </div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-zinc-700/50 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {steps.map((step) => {
            const isComplete = completed.includes(step.id);
            return (
              <Link key={step.id} href={step.href}>
                <div className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${isComplete ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-white/2 cursor-pointer"}`}>
                  <div className="text-xl">{step.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isComplete ? "text-zinc-400 line-through" : "text-white"}`}>{step.title}</p>
                    <p className="text-xs text-zinc-500">{step.description}</p>
                  </div>
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-zinc-500 flex-shrink-0 group-hover:text-primary transition-colors" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
