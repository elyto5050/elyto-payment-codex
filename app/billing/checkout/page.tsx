"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";

type PaymentInfo = {
  paymentRef: string;
  amount: number;
  targetUPI: string;
  plan: string;
  status: string;
  planDef?: {
    name?: string;
    price?: number;
    currency?: string;
    maxVerifications?: number;
    maxProjects?: number;
    supportLevel?: string;
  } | null;
};

export default function BillingCheckoutPage() {
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle"|"verifying"|"success"|"not_found"|"error"|"service_unavailable">("idle");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Fetch the current user's pending payment (no paymentRef in URL)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiFetch(`/api/dashboard/billing/payment`);
        if (!mounted) return;
        setPayment(data as PaymentInfo);
      } catch (err) {
        console.error("Failed to load current pending payment", err);
        // Redirect to billing dashboard if none
        router.replace("/dashboard/billing");
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    if (!payment) return;
    const upi = `upi://pay?pa=${encodeURIComponent(payment.targetUPI)}&pn=${encodeURIComponent("Elyto")}&am=${payment.amount}&cu=INR`;
    let mounted = true;
    (async () => {
      try {
        const url = await QRCode.toDataURL(upi, { width: 160, margin: 1 });
        if (mounted) setQrDataUrl(url);
      } catch (e) {
        if (mounted) setQrDataUrl(null);
      }
    })();
    return () => { mounted = false; };
  }, [payment]);

  const copyUPI = async () => {
    if (!payment) return;
    try {
      await navigator.clipboard.writeText(payment.targetUPI);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // ignore
    }
  };

  const openUPI = () => {
    if (!payment) return;
    window.location.href = `upi://pay?pa=${encodeURIComponent(payment.targetUPI)}&pn=${encodeURIComponent("Elyto")}&am=${payment.amount}&cu=INR`;
  };

  const submitUtr = async () => {
    if (!payment?.paymentRef || !utr) return;
    setLoading(true);
    setPhase("verifying");
    setStatus("Verifying — searching Gmail for transaction...");

    try {
      const res = await apiFetch("/api/dashboard/billing/submit-utr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRef: payment.paymentRef, utr })
      });
      if (res?.matched) {
        setPhase("success");
        setStatus("Payment verified successfully — activating plan...");
        console.info("Verification result:", res?.result ?? res);
        setTimeout(() => { router.push("/dashboard"); }, 2000);
        return;
      }

      // Not matched — transaction not yet found
      setPhase("not_found");
      setStatus(res?.message ?? "Payment not found. We'll keep searching.");
    } catch (err: any) {
      if (err?.status === 503) {
        setPhase("service_unavailable");
        setStatus(err?.message ?? "Verification service temporarily unavailable. Try again later.");
      } else {
        setPhase("error");
        setStatus(err?.message ?? "Failed to submit UTR");
      }
    } finally {
      setLoading(false);
    }
  };

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sel = localStorage.getItem("selectedPlan");
      setSelectedPlan(sel ?? null);
    } catch (_) {
      setSelectedPlan(null);
    }
  }, []);

  // Fallback: if no selectedPlan in localStorage but payment exists, use payment.plan
  useEffect(() => {
    if (!selectedPlan && payment?.plan) {
      try { setSelectedPlan(payment.plan); } catch (_) {}
    }
  }, [payment, selectedPlan]);

  // Prefer `selectedPlan` (localStorage) as the single source of truth for checkout.
  const planFromApi = payment?.planDef ?? null;
  const checkoutPlanKey = (selectedPlan ?? payment?.plan ?? "") as keyof typeof PLANS | undefined;
  const planDef = checkoutPlanKey ? ((PLANS as any)[checkoutPlanKey] as any) : (planFromApi ?? null);
  const planName = planDef?.name ?? (checkoutPlanKey ?? payment?.plan ?? "");
  const planPrice = planDef?.price ?? payment?.amount ?? 0;
  const verificationLimit = planDef?.maxVerifications ?? null;
  const projectLimit = planDef?.maxProjects ?? null;
  const support = planDef?.supportLevel ?? "";

  const checkoutPlan = (checkoutPlanKey ?? "") as string;
  const allMatch = Boolean(selectedPlan && payment?.plan && selectedPlan === payment.plan && payment.plan === checkoutPlan);

  return (
    <div className="bg-black/95 text-white py-12 px-4">
      <div className="mx-auto max-w-[550px] w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Complete Your Subscription</h1>
          <p className="mt-2 text-zinc-300">Pay securely with UPI and activate your Elyto plan instantly.</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/5 text-cyan-300 text-sm font-semibold">{planName}</span>
            <span className="text-sm text-zinc-400">{planPrice ? `₹${planPrice}/month` : "Pricing"}</span>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="bg-black/40 backdrop-blur-md border border-white/6 rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex md:gap-6 p-6">
            <div className="md:flex-shrink-0 md:w-[200px] mb-6 md:mb-0">
              <div className="rounded-xl p-4 bg-gradient-to-b from-white/3 to-white/2 border border-white/8 shadow-[0_10px_30px_rgba(6,182,212,0.08)] hover:scale-[1.01] transform transition-all duration-300">
                <div className="relative w-[160px] h-[160px] mx-auto rounded-lg overflow-hidden">
                  <motion.img src={qrDataUrl ?? undefined} alt="UPI QR" width={160} height={160} initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className={`w-full h-full object-cover rounded-lg ${loading ? "opacity-70 animate-pulse" : ""}`} />
                  <div className="absolute -inset-1 rounded-lg pointer-events-none ring-1 ring-cyan-500/10 blur-sm" />
                </div>

                <div className="mt-4 text-center">
                  <div className="text-sm text-zinc-300">UPI ID</div>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <div className="font-mono font-medium text-white">{payment?.targetUPI}</div>
                  </div>

                  <div className="mt-3 flex justify-center gap-3">
                    <Button onClick={copyUPI} className="px-3 py-1 text-sm">{copied ? "Copied" : "Copy UPI ID"}</Button>
                    <Button variant="outline" onClick={openUPI} className="px-3 py-1 text-sm">Open UPI</Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-zinc-500 text-center">Tip: Use the UPI app to pay the exact amount and include the Payment Reference.</div>
            </div>

            <div className="md:flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-zinc-400">Plan</div>
                  <div className="text-lg font-semibold mt-1">{planName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-400">Price</div>
                  <div className="text-2xl font-bold text-cyan-300 mt-1">{planPrice ? `₹${planPrice}` : "₹--"}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-zinc-400">Duration</div>
                <div className="text-sm text-white">1 Month</div>
              </div>

              <div className="mt-6">
                <div className="text-sm text-zinc-400 mb-2">Features</div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-sm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="text-zinc-200">{verificationLimit === -1 ? "Unlimited verifications" : `${verificationLimit} verifications`}</span></li>
                  <li className="flex items-center gap-3 text-sm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="text-zinc-200">{projectLimit === -1 ? "Unlimited projects" : `${projectLimit} projects`}</span></li>
                  <li className="flex items-center gap-3 text-sm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="text-zinc-200">{support}</span></li>
                </ul>
              </div>

              <div className="mt-6">
                <div className="text-sm text-zinc-400 mb-2">Payment Steps</div>
                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-200">
                  <li>Scan QR</li>
                  <li>Pay {planPrice ? `₹${planPrice}` : "the amount"}</li>
                  <li>Enter UTR</li>
                  <li>Click Verify</li>
                </ol>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-zinc-400 mb-2">Enter UTR / Transaction ID</label>
                <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Enter UTR / Transaction ID" className="w-full rounded-lg p-3 bg-white/6 border border-white/8 placeholder-zinc-500 text-sm outline-none focus:ring-2 focus:ring-cyan-400/30" />

                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={submitUtr} disabled={loading || !utr}>{loading ? "Verifying..." : "Verify Payment"}</Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard/billing')}>Cancel</Button>
                </div>
              </div>

              <div className="mt-6">
                {phase === "error" && status && (
                  <div className="rounded-lg bg-red-900/60 border border-red-700 p-3 text-sm text-red-200">{status}</div>
                )}

                {phase === "service_unavailable" && status && (
                  <div className="rounded-lg bg-amber-900/60 border border-amber-700 p-3 text-sm text-amber-200">{status}</div>
                )}

                {phase === "verifying" && (
                  <div className="rounded-lg bg-zinc-900/60 border border-white/6 p-3 text-sm text-zinc-200">
                    <div className="font-medium text-sm text-cyan-300">{status}</div>
                    <div className="mt-2 text-xs text-zinc-400">Searching Gmail for transaction · Matching amount · Matching UTR</div>
                  </div>
                )}

                {phase === "not_found" && (
                  <div className="rounded-lg bg-white/5 border border-white/6 p-3 text-sm text-zinc-200">
                    <div className="font-medium text-sm text-zinc-200">{status}</div>
                    <div className="mt-2 text-xs text-zinc-400">We will continue to monitor incoming transactions and notify you when a match is found. You can retry verification anytime.</div>
                  </div>
                )}

                {phase === "success" && (
                  <div className="rounded-lg bg-emerald-900/70 border border-emerald-600 p-4 text-sm text-emerald-100 flex items-center gap-3"><svg className="w-6 h-6 text-emerald-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><div><div className="font-semibold">Payment Verified Successfully</div><div className="text-xs text-emerald-200">{planName} activated. Redirecting to dashboard...</div></div></div>
                )}
              </div>

              <div className="mt-6">
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-sm text-zinc-300">Selected values</div>
                  <div className="mt-2 text-sm text-white">
                    <div>selectedPlan: <span className="font-medium">{selectedPlan ?? "(none)"}</span></div>
                    <div>pendingPayment.plan: <span className="font-medium">{payment?.plan ?? "(none)"}</span></div>
                    <div>checkout.plan: <span className="font-medium">{checkoutPlan ?? "(none)"}</span></div>
                  </div>
                  <div className="mt-3">
                    {allMatch ? (
                      <div className="text-emerald-400 font-semibold">All values match ✓</div>
                    ) : (
                      <div className="text-amber-400 font-medium">Values do not match — inspect selected plan and retry</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
