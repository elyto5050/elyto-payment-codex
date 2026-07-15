"use client";

import { useEffect, useState } from "react";
import { AlertCircle, WifiOff, X } from "lucide-react";

interface Toast {
  id: string;
  type: "error" | "warning" | "success" | "info";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Global toast store
let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(toast: Omit<Toast, "id">) {
  const id = String(toastId++);
  const newToast: Toast = { ...toast, id };
  listeners.forEach((listener) => listener(newToast));

  if (toast.duration !== 0) {
    setTimeout(() => removeToast(id), toast.duration || 5000);
  }

  return id;
}

export function removeToast(id: string) {
  listeners.forEach((listener) => listener({ id, type: "info", title: "", message: "", duration: 0 }));
}

// Hook to subscribe to toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: Toast) => {
      if (!toast.message) {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      } else {
        setToasts((prev) => {
          const filtered = prev.filter((t) => t.id !== toast.id);
          return [...filtered, toast];
        });
      }
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  return toasts;
}

// Global Toast Container Component
export function ToastContainer() {
  const toasts = useToast();

  return (
    <div className="fixed top-4 right-4 z-[999] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }: { toast: Toast }) {
  const bgColor =
    toast.type === "error"
      ? "bg-red-600/95"
      : toast.type === "warning"
        ? "bg-amber-600/95"
        : toast.type === "success"
          ? "bg-emerald-600/95"
          : "bg-blue-600/95";

  const icon =
    toast.type === "error" || toast.type === "warning" ? (
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
    ) : toast.type === "success" ? (
      <div className="h-4 w-4 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0" />
    ) : (
      <WifiOff className="h-4 w-4 flex-shrink-0" />
    );

  return (
    <div
      className={`${bgColor} text-white rounded-lg px-4 py-3 shadow-lg border border-white/20 flex items-start gap-3 pointer-events-auto max-w-sm`}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        <p className="text-xs text-white/80 mt-0.5">{toast.message}</p>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="text-xs font-medium text-white/90 hover:text-white mt-2 underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 rounded hover:bg-white/20 p-0.5 text-white/70 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
