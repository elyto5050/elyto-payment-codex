"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { ToastList } from "./toast";

type ToastType = "success" | "error" | "info" | "default";

type Toast = { id: string; message: string; type: ToastType; duration?: number; actionLabel?: string };

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => string;
  addActionToast: (message: string, actionLabel: string, onAction: () => void, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const actionMap = useRef<Record<string, () => void>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    delete actionMap.current[id];
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "default", duration = 4500) => {
      const id = String(Date.now()) + Math.random().toString(16).slice(2, 8);
      setToasts((t) => [...t, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  const addActionToast = useCallback(
    (message: string, actionLabel: string, onAction: () => void, type: ToastType = "error", duration = 0) => {
      const id = String(Date.now()) + Math.random().toString(16).slice(2, 8);
      actionMap.current[id] = onAction;
      setToasts((t) => [...t, { id, message, type, duration, actionLabel }]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, addActionToast, removeToast }}>
      {children}
      <ToastList toasts={toasts} removeToast={removeToast} actionMap={actionMap.current} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
