"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Check } from "lucide-react";
import { PLANS } from "@/lib/plans";

type Stage = "profile" | "volume" | "recommendation" | "complete";

interface OnboardingData {
  firstName: string;
  lastName: string;
  profession: string;
  monthlyVolume: string;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onChoosePlan?: (data: OnboardingData, planKey: string) => void;
  isLoading?: boolean;
}

export function OnboardingWizard({ onComplete, onChoosePlan, isLoading = false }: OnboardingWizardProps) {
  const [stage, setStage] = useState<Stage>("profile");
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    profession: "",
    monthlyVolume: ""
  });

  const professions = [
    "Student",
    "Developer",
    "Freelancer",
    "Founder",
    "SaaS Founder",
    "Agency Owner",
    "E-commerce Seller",
    "Creator",
    "Employee",
    "Other"
  ];

  const volumes = [
    { value: "10", label: "10 payments/month" },
    { value: "100", label: "100 payments/month" },
    { value: "500", label: "500 payments/month" },
    { value: "1000", label: "1,000 payments/month" },
    { value: "1000+", label: "1,000+ payments/month" }
  ];

  const recommendedInfo = getRecommendedPlanInfo(data.monthlyVolume);
  const recommendedPlan = recommendedInfo && recommendedInfo.plan ? (PLANS[recommendedInfo.plan] as any) : null;

  const handleProfileSubmit = () => {
    if (data.firstName && data.lastName && data.profession) {
      setStage("volume");
    }
  };

  const handleVolumeSubmit = () => {
    if (data.monthlyVolume) {
      setStage("recommendation");
    }
  };

  const handleRecommendationSubmit = () => {
    onComplete(data);
    setStage("complete");
  };

  if (stage === "complete") {
    return (
      <div className="space-y-4 text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-emerald-500/20 border border-emerald-500/50 p-4">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-white">Welcome to Elyto!</h2>
        <p className="text-sm text-zinc-400">
          Your workspace is ready. Start by connecting your Gmail and creating your first project.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {["profile", "volume", "recommendation"].map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                ["profile", "volume", "recommendation"].indexOf(stage) >= idx
                  ? "bg-cyan-400"
                  : "bg-zinc-600"
              }`}
            />
            {idx < 2 && (
              <div
                className={`h-0.5 w-6 transition-colors ${
                  ["profile", "volume", "recommendation"].indexOf(stage) > idx
                    ? "bg-cyan-400"
                    : "bg-zinc-600"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Stage: Profile */}
      {stage === "profile" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Tell us about you</h2>
            <p className="text-sm text-zinc-400">This helps us customize your experience</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-2">First Name</label>
              <Input
                placeholder="John"
                value={data.firstName}
                onChange={(e) => setData({ ...data, firstName: e.target.value })}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-2">Last Name</label>
              <Input
                placeholder="Doe"
                value={data.lastName}
                onChange={(e) => setData({ ...data, lastName: e.target.value })}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-2">Profession</label>
              <select
                value={data.profession}
                onChange={(e) => setData({ ...data, profession: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              >
                <option value="">Select profession</option>
                {professions.map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleProfileSubmit}
            disabled={!data.firstName || !data.lastName || !data.profession}
            className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 mt-6"
          >
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Stage: Volume */}
      {stage === "volume" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">How many payments monthly?</h2>
            <p className="text-sm text-zinc-400">We&apos;ll recommend the best plan for you</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {volumes.map((vol) => (
              <button
                key={vol.value}
                onClick={() => setData({ ...data, monthlyVolume: vol.value })}
                className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  data.monthlyVolume === vol.value
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/20"
                }`}
              >
                {vol.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setStage("profile")}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleVolumeSubmit}
              disabled={!data.monthlyVolume}
              className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-700"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Stage: Recommendation */}
      {stage === "recommendation" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Recommended Plan</h2>
            <p className="text-sm text-zinc-400">Based on your expected volume</p>
          </div>

            <RecommendationCard recommendedInfo={recommendedInfo} planDef={recommendedPlan} monthlyVolume={data.monthlyVolume} />

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs text-zinc-400 mb-3">All plans include:</p>
            <div className="space-y-2 text-xs text-zinc-300">
              <p>✓ Real-time payment verification</p>
              <p>✓ Webhook delivery</p>
              <p>✓ API access</p>
              <p>✓ Email support</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setStage("volume")}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => {
                if (typeof onChoosePlan === "function") {
                  onChoosePlan(data, recommendedInfo?.plan ?? "");
                } else {
                  handleRecommendationSubmit();
                }
              }}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-700"
            >
              {isLoading ? "Setting up..." : "Complete Setup"}
            </Button>
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => onComplete(data)}
              variant="ghost"
              className="w-1/2 text-sm"
            >
              Continue for Free
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getRecommendedPlanInfo(volume: string) {
  const vol = parseInt(volume.replace("+", ""));
  if (!vol || vol <= 10) return { title: "Recommended", plan: "FREE", reason: "Low expected volume — start for free." };
  if (vol <= 100) return { title: "Recommended", plan: "PREMIUM_1", reason: "Suitable for small teams and light volume." };
  if (vol <= 500) return { title: "Recommended", plan: "PREMIUM_2", reason: "For your expected payment volume this plan is ideal." };
  if (vol <= 1000) return { title: "Recommended", plan: "PREMIUM_3", reason: "Higher quota for scaling volumes." };
  return { title: "Recommended", plan: "ENTERPRISE", reason: "Custom enterprise plan recommended for very high volume." };
}

function RecommendationCard({
  recommendedInfo,
  planDef,
  monthlyVolume
}: {
  recommendedInfo: { title: string; plan: string; reason: string } | null;
  planDef: any | null;
  monthlyVolume: string;
}) {
  if (!recommendedInfo) return null;
  const plan = planDef;
  const priceLabel = plan && plan.price && plan.price > 0 ? `₹${plan.price} / month` : `₹0`;

  return (
    <div className="rounded-lg border-2 border-cyan-400/50 bg-cyan-400/10 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-cyan-200">{plan ? plan.name : recommendedInfo.plan}</h3>
          <p className="text-xs text-cyan-300/70 mt-1">{plan ? priceLabel : "Pricing available on plans page"}</p>
        </div>
        <span className="rounded-full bg-cyan-400/20 border border-cyan-400/30 px-3 py-1 text-xs font-medium text-cyan-200">
          {recommendedInfo.title}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {plan && (
          <p className="text-cyan-100">
            <strong>Verifications:</strong> {plan.maxVerifications === -1 ? "Unlimited" : plan.maxVerifications}
          </p>
        )}
        <p className="text-cyan-100/80 text-xs">{recommendedInfo.reason}</p>
        <p className="text-cyan-100/80 text-xs">For your expected {monthlyVolume} payments/month, this recommendation helps you choose.</p>
      </div>
    </div>
  );
}
