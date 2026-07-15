"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { showToast } from "@/components/dashboard/toast-container";
import apiFetch from "@/lib/api/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (data: {
    firstName: string;
    lastName: string;
    profession: string;
    monthlyVolume: string;
  }) => {
    setIsLoading(true);
    try {
      await apiFetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          profession: data.profession,
          monthlyVolume: parseInt(data.monthlyVolume.replace("+", ""))
        })
      });

      // Redirect to dashboard after completing onboarding for free users
      router.push("/dashboard");
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error?.message || "Setup failed"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoosePlan = async (data: {
    firstName: string;
    lastName: string;
    profession: string;
    monthlyVolume: string;
  }, planKey: string) => {
    setIsLoading(true);
    try {
      // Complete onboarding first
      await apiFetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          profession: data.profession,
          monthlyVolume: parseInt(data.monthlyVolume.replace("+", ""))
        })
      });

      // If FREE plan selected, apply and go to dashboard
      if (planKey === "FREE") {
        try {
          await apiFetch("/api/dashboard/billing/upgrade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: "FREE" })
          });
          router.push("/dashboard");
          return;
        } catch (err: any) {
          showToast({ type: "error", title: "Error", message: err?.message || "Failed to apply free plan" });
          router.push("/dashboard/billing");
          return;
        }
      }

      // For paid plans, start checkout then redirect to the dedicated checkout page
      try {
        const checkoutResp = await apiFetch("/api/dashboard/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planKey })
        });

        if (checkoutResp?.paymentRef) {
          // Persist selected plan locally so checkout page can verify values
          try {
            localStorage.setItem("selectedPlan", planKey);
            localStorage.setItem("pendingPaymentRef", checkoutResp.paymentRef);
          } catch (_) {}

          router.push(`/billing/checkout`);
          return;
        }

        router.push("/dashboard/billing");
      } catch (err: any) {
        showToast({ type: "error", title: "Error", message: err?.message || "Checkout failed" });
        router.push("/dashboard/billing");
      }
    } catch (error: any) {
      showToast({ type: "error", title: "Error", message: error?.message || "Checkout failed" });
    } finally {
      setIsLoading(false);
    }
  };

  // Note: onboarding should not auto-initiate checkout. Plan selection happens on the
  // /plans page where users explicitly choose a plan. `onComplete` handles finishing
  // onboarding and redirecting users to the plans page.

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_22%),linear-gradient(180deg,#050505_0%,#09090b_45%,#050505_100%)] text-white flex items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      
      <div className="relative w-full max-w-2xl">
        <OnboardingWizard onComplete={handleComplete} onChoosePlan={handleChoosePlan} isLoading={isLoading} />
      </div>
    </div>
  );
}
