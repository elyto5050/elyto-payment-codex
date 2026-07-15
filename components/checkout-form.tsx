"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

type CheckoutFormProps = {
  orderId: string;
  initialStatus: string;
};

export function CheckoutForm({ orderId, initialStatus }: CheckoutFormProps) {
  const [utr, setUtr] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const refreshStatus = async () => {
      try {
        const response = await fetch(`/api/v1/orders/${orderId}`);
        if (!response.ok) return;
        const json = await response.json();
        const nextStatus = json.data?.status;

        if (nextStatus && nextStatus !== status) {
          setStatus(nextStatus);
        }

        if (nextStatus === "VERIFIED") {
          setMessage("Payment verified successfully. You can close this page.");
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }

        if (nextStatus === "FAILED" || nextStatus === "EXPIRED") {
          setMessage("Payment verification failed. Please contact the seller.");
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch {
        // keep polling; occasional failures are expected while verification completes
      }
    };

    if (status === "UTR_SUBMITTED" || status === "VERIFYING") {
      refreshStatus();
      interval = setInterval(refreshStatus, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [orderId, status]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/pay/${orderId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr })
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message ?? "Verification failed");
      }

      setStatus(json.data.status);
      setMessage("UTR submitted. We're verifying your payment — this usually takes a few seconds.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isVerified = status === "VERIFIED" || status === "PAID";
  const isPendingVerification = status === "UTR_SUBMITTED" || status === "VERIFYING";
  const isFailed = status === "FAILED" || status === "EXPIRED";

  return (
    <>
      <div className="mb-6 flex justify-center">
        <Logo size={36} />
      </div>

      {isVerified ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-200">
          Payment verified successfully. You can close this page.
        </div>
      ) : isFailed ? (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-4 text-center text-sm text-rose-200">
          Payment verification failed. Please contact the seller.
        </div>
      ) : (
        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm text-zinc-300" htmlFor="utr">
            Submit UTR / UPI Reference Number
          </label>
          <Input
            id="utr"
            name="utr"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="Enter 12-digit UTR"
            required
            minLength={8}
            maxLength={32}
          />
          <Button type="submit" className="w-full" disabled={loading || isPendingVerification}>
            {loading ? "Submitting…" : isPendingVerification ? "Verifying payment…" : "Verify payment"}
          </Button>
        </form>
      )}

      {message ? <p className="mt-4 text-center text-xs text-zinc-400">{message}</p> : null}
    </>
  );
}
