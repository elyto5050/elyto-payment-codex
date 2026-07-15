"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-context";
import { DashboardHeader } from "@/components/dashboard/header";
import { PLANS } from "@/lib/plans";

export default function PlansPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const chooseFree = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/dashboard/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "FREE" })
      });
      addToast("Free plan applied", "success");
      router.push("/dashboard");
    } catch (err: any) {
      addToast(err?.message || "Failed to apply free plan", "error");
    } finally {
      setLoading(false);
    }
  };

  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const choosePremium = async () => {
    setLoading(true);
    try {
      const resp = await apiFetch("/api/dashboard/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan })
      });

      if (resp?.paymentRef) {
        try { localStorage.setItem("selectedPlan", selectedPlan); localStorage.setItem("pendingPaymentRef", resp.paymentRef); } catch (_) {}
        router.push("/billing/checkout");
        return;
      }
      // fallback
      router.push("/dashboard/billing");
    } catch (err: any) {
      addToast(err?.message || "Failed to start checkout", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader title="Choose a plan" description="Select a plan to get started" />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-6 bg-white/[0.02]">
            <h3 className="text-lg font-semibold">{PLANS.FREE.name}</h3>
            <p className="text-sm text-zinc-400 mt-2">₹{PLANS.FREE.price} — {PLANS.FREE.maxVerifications} successful verifications • {PLANS.FREE.maxProjects} project • {PLANS.FREE.supportLevel} support</p>
            <div className="mt-4">
              <Button onClick={chooseFree} disabled={loading} className="w-full">Continue For Free</Button>
            </div>
          </div>

          <div className="rounded-lg border p-6 bg-white/[0.02]">
            <h3 className="text-lg font-semibold">{PLANS.PREMIUM_2.name}</h3>
            <p className="text-sm text-zinc-400 mt-2">₹{PLANS.PREMIUM_2.price} / month — {PLANS.PREMIUM_2.maxVerifications} verifications • {PLANS.PREMIUM_2.maxProjects} projects • {PLANS.PREMIUM_2.supportLevel} support</p>
            <div className="mt-4 flex gap-2">
              <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} className="flex-1 rounded-md bg-white/[0.03] border border-white/10 px-3 py-2 text-sm">
                <option value="">Select plan...</option>
                <option value="PREMIUM_1">{PLANS.PREMIUM_1.name} — ₹{PLANS.PREMIUM_1.price}/mo</option>
                <option value="PREMIUM_2">{PLANS.PREMIUM_2.name} — ₹{PLANS.PREMIUM_2.price}/mo</option>
                <option value="PREMIUM_3">{PLANS.PREMIUM_3.name} — ₹{PLANS.PREMIUM_3.price}/mo</option>
              </select>
              <Button onClick={choosePremium} disabled={loading || !selectedPlan} className="px-4">Choose</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
