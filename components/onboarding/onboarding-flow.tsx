"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";

export type OnboardingStage = "profile" | "volume" | "recommendation" | "complete";

export interface OnboardingData {
  firstName: string;
  lastName: string;
  profession: string;
  monthlyVolume: string;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

const PROFESSIONS = [
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

const VOLUME_OPTIONS = [
  { value: "10", label: "~10 payments/month" },
  { value: "100", label: "~100 payments/month" },
  { value: "500", label: "~500 payments/month" },
  { value: "1000", label: "~1,000 payments/month" },
  { value: "1000+", label: "1,000+ payments/month" }
];

function getRecommendedPlanInfo(volume: string) {
  const vol = parseInt(volume.replace("+", ""));
  if (!vol || vol <= 10) return { title: "Recommended", plan: "FREE", reason: "Low expected volume — start for free." };
  if (vol <= 100) return { title: "Recommended", plan: "PREMIUM_1", reason: "Suitable for small teams and light volume." };
  if (vol <= 250) return { title: "Recommended", plan: "PREMIUM_1", reason: "Good fit for your growth stage." };
  if (vol <= 500) return { title: "Recommended", plan: "PREMIUM_2", reason: "For your expected payment volume this plan is ideal." };
  if (vol <= 1000) return { title: "Recommended", plan: "PREMIUM_3", reason: "Higher quota for scaling volumes." };
  return { title: "Recommended", plan: "ENTERPRISE", reason: "Custom enterprise plan recommended for very high volume." };
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [stage, setStage] = useState<OnboardingStage>("profile");
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    profession: "",
    monthlyVolume: ""
  });

  const handleNext = () => {
    if (stage === "profile" && data.firstName && data.lastName && data.profession) {
      setStage("volume");
    } else if (stage === "volume" && data.monthlyVolume) {
      setStage("recommendation");
    } else if (stage === "recommendation") {
      onComplete(data);
      setStage("complete");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.11),rgba(255,255,255,0.03))]">
      <div className="w-full max-w-md">
        {stage === "profile" && <ProfileStage data={data} onDataChange={setData} />}
        {stage === "volume" && <VolumeStage data={data} onDataChange={setData} />}
        {stage === "recommendation" && <RecommendationStage data={data} />}
        {stage === "complete" && <CompleteStage />}

        {stage !== "complete" && (
          <div className="mt-8 flex gap-3">
            {stage !== "profile" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (stage === "volume") setStage("profile");
                  else if (stage === "recommendation") setStage("volume");
                }}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!isStageValid(stage, data)}
              className="flex-1 gap-2"
            >
              {stage === "recommendation" ? "Complete Setup" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileStage({
  data,
  onDataChange
}: {
  data: OnboardingData;
  onDataChange: (data: OnboardingData) => void;
}) {
  return (
    <div className="space-y-6 rounded-dense bg-white/[0.02] border border-white/10 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome to Elyto</h1>
        <p className="text-sm text-zinc-400 mt-2">Let&apos;s get your profile set up</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">First Name</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onDataChange({ ...data, firstName: e.target.value })}
            placeholder="John"
            className="w-full px-3 py-2 rounded-dense bg-white/[0.05] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Last Name</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onDataChange({ ...data, lastName: e.target.value })}
            placeholder="Doe"
            className="w-full px-3 py-2 rounded-dense bg-white/[0.05] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Your Profession</label>
          <select
            value={data.profession}
            onChange={(e) => onDataChange({ ...data, profession: e.target.value })}
            className="w-full px-3 py-2 rounded-dense bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          >
            <option value="" className="bg-slate-900">Select a profession...</option>
            {PROFESSIONS.map((prof) => (
              <option key={prof} value={prof} className="bg-slate-900">
                {prof}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function VolumeStage({
  data,
  onDataChange
}: {
  data: OnboardingData;
  onDataChange: (data: OnboardingData) => void;
}) {
  return (
    <div className="space-y-6 rounded-dense bg-white/[0.02] border border-white/10 p-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Payment Volume</h2>
        <p className="text-sm text-zinc-400 mt-2">How many payments do you expect per month?</p>
      </div>

      <div className="space-y-2">
        {VOLUME_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onDataChange({ ...data, monthlyVolume: option.value })}
            className={`w-full px-4 py-3 rounded-dense border transition-all ${
              data.monthlyVolume === option.value
                ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-200"
                : "border-white/10 hover:bg-white/[0.04] text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RecommendationStage({ data }: { data: OnboardingData }) {
  const recommendedInfo = getRecommendedPlanInfo(data.monthlyVolume);
  const planDef = recommendedInfo ? (PLANS as any)[recommendedInfo.plan] : null;
  const recommendedPlan = planDef ? planDef.name : (recommendedInfo?.plan ?? "Free");
  const isPremium = planDef ? planDef.key !== "FREE" : false;

  return (
    <div className="space-y-6 rounded-dense bg-white/[0.02] border border-white/10 p-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Recommended Plan</h2>
        <p className="text-sm text-zinc-400 mt-2">Based on your expected volume</p>
      </div>

      <div className={`rounded-dense border p-6 ${
        isPremium
          ? "bg-gradient-to-br from-cyan-400/10 to-blue-400/5 border-cyan-400/20"
          : "bg-white/[0.05] border-white/10"
      }`}>
        <p className="text-sm text-zinc-400 mb-1">Recommended</p>
        <h3 className="text-3xl font-bold text-white mb-2">{recommendedPlan}{planDef && planDef.price ? ` — ₹${planDef.price}/mo` : ""}</h3>
        <p className="text-sm text-zinc-400 mt-2">{recommendedInfo?.reason}</p>
        
        {isPremium && (
          <div className="space-y-2 text-sm text-zinc-300 mt-4">
            <p>✓ Suitable for your estimated volume</p>
            <p>✓ Cost-effective pricing</p>
            <p>✓ Priority support included</p>
          </div>
        )}
        {!isPremium && (
          <p className="text-sm text-zinc-300 mt-4">Perfect to get started - upgrade anytime as you grow</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="w-full rounded-dense">
          Learn about plans
        </Button>
        <Button className="w-full rounded-dense bg-cyan-600 hover:bg-cyan-700">
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}

function CompleteStage() {
  return (
    <div className="space-y-6 rounded-dense bg-white/[0.02] border border-white/10 p-6 text-center">
      <div className="flex justify-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">All set!</h2>
        <p className="text-sm text-zinc-400 mt-2">Your dashboard is ready. Let&apos;s start verifying payments.</p>
      </div>
      <Button className="w-full rounded-dense bg-cyan-600 hover:bg-cyan-700">
        Go to Dashboard
      </Button>
    </div>
  );
}

function isStageValid(stage: OnboardingStage, data: OnboardingData): boolean {
  switch (stage) {
    case "profile":
      return !!(data.firstName && data.lastName && data.profession);
    case "volume":
      return !!data.monthlyVolume;
    case "recommendation":
      return true;
    default:
      return false;
  }
}
