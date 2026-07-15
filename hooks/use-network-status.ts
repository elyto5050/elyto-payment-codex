"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast-context";

let connectionLostToastId: string | null = null;

/**
 * Hook to monitor internet connection and show toast alerts
 * Displays red error toast when connection is lost
 */
export function useNetworkStatus() {
  const { addToast, removeToast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      // Connection restored
      if (connectionLostToastId) {
        removeToast(connectionLostToastId);
        connectionLostToastId = null;
      }
      addToast("Connection restored", "success", 3000);
    };

    const handleOffline = () => {
      // Connection lost - show persistent alert (no auto-dismiss)
      const message = "Connection error: Internet connection lost. Retrying...";
      const type = "error";

      // Only add one persistent network toast and keep its id so we can remove it later
      if (!connectionLostToastId) {
        connectionLostToastId = addToast(message, type, 0); // 0 duration = no auto-dismiss
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addToast, removeToast]);
}
