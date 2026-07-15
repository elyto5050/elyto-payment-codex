"use client";

import { useEffect, useState } from "react";
import apiFetch from "@/lib/api/client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AcceptInviteClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    (async () => {
      try {
        await apiFetch("/api/team/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
        setStatus("success");
      } catch (e) {
        setStatus("error");
      }
    })();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center">
        {status === "loading" && <p className="text-zinc-400">Accepting invite…</p>}
        {status === "success" && (
          <>
            <p className="text-emerald-400">Invite accepted!</p>
            <Button className="mt-4" onClick={() => { window.location.href = "/dashboard"; }}>Go to dashboard</Button>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-rose-400">Invalid or expired invite. Sign in with the invited email.</p>
            <Button className="mt-4" variant="outline" onClick={() => { window.location.href = "/login"; }}>Sign in</Button>
          </>
        )}
      </section>
    </main>
  );
}
