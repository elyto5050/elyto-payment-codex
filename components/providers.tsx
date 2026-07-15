"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/toast-context";

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { addActionToast } = useToast();
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));

  useEffect(() => {
    const handleQueryEvents = (event: any) => {
      try {
        const q = event?.query;
        if (!q) return;
        if (q.state?.status === "error") {
          const err: any = q.state.error;
          const message = err?.message || err?.body?.error?.message || "Unable to connect to server. Please try again.";
          addActionToast(message, "Retry", () => {
            try {
              client.invalidateQueries({ queryKey: q.queryKey });
            } catch (e) {
              client.invalidateQueries();
            }
          }, "error", 0);
        }
      } catch (e) {
        // ignore
      }
    };

    const handleMutationEvents = (event: any) => {
      try {
        const m = event?.mutation;
        if (!m) return;
        if (m.state?.status === "error") {
          const err: any = m.state.error;
          const message = err?.message || err?.body?.error?.message || "Action failed. Please try again.";
          addActionToast(message, "Retry", () => {
            try {
              // best-effort: refresh related queries
              client.invalidateQueries();
            } catch (e) {
              // ignore
            }
          }, "error", 0);
        }
      } catch (e) {
        // ignore
      }
    };

    const unsubQ = client.getQueryCache().subscribe(handleQueryEvents);
    const unsubM = client.getMutationCache().subscribe(handleMutationEvents);

    return () => {
      try {
        unsubQ();
      } catch {}
      try {
        unsubM();
      } catch {}
    };
  }, [client, addActionToast]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <InnerProviders>{children}</InnerProviders>
    </ToastProvider>
  );
}
