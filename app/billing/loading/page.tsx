"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingLoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(`/billing/checkout`);
    }, 1000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Please wait while we redirect you to payment...</h2>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      </div>
    </div>
  );
}
