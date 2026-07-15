"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error in app route:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgba(11,11,15,0.96)]">
      <div className="max-w-md p-8 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-600/10 text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-400">An unexpected error occurred. Try reloading the page or contact support if the problem persists.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => reset()} className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700">Try again</button>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-md bg-white/5">Reload</button>
        </div>
      </div>
    </div>
  );
}
