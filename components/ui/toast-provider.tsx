"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

type ToastType = "error" | "success" | "info" | "default";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "default", duration = 4500) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: () => void;
}) {
  const bgColor =
    toast.type === "error"
      ? "bg-red-500/90"
      : toast.type === "success"
        ? "bg-emerald-500/90"
        : "bg-blue-500/90";

  const icon =
    toast.type === "error" ? (
      <AlertCircle className="h-4 w-4" />
    ) : toast.type === "success" ? (
      <CheckCircle className="h-4 w-4" />
    ) : (
      <Info className="h-4 w-4" />
    );

  return (
    <div
      className={`${bgColor} text-white rounded-dense px-4 py-3 flex items-center gap-3 shadow-lg pointer-events-auto max-w-sm`}
    >
      {icon}
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onRemove}
        className="text-white/70 hover:text-white transition-colors ml-2"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
