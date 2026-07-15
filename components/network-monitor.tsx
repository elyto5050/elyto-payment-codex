"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast-context";

/**
 * NetworkMonitor - Monitors internet connection and displays toast alerts
 * Shows persistent red error toast when connection is lost
 * Displays success message when connection is restored
 */
export function NetworkMonitor() {
  const { addToast } = useToast();
  const connectionLostToastId = useRef<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      // Clear the connection lost toast
      connectionLostToastId.current = null;
      addToast("Connection restored", "success", 3000);
    };

    const handleOffline = () => {
      // Show persistent error toast (duration 0 = no auto-dismiss)
      connectionLostToastId.current = addToast(
        "Connection error: Internet connection lost. Retrying...",
        "error",
        0
      );
    };

    // Listen for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial connection status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addToast]);

  // This component doesn't render anything itself
  return null;
}