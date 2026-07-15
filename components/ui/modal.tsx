"use client";

import { ReactNode } from "react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-card p-6">
        {title && <h3 className="text-lg font-medium">{title}</h3>}
        <div className="mt-4">{children}</div>
        <div className="mt-4 flex justify-end">
          <button className="px-3 py-2 rounded-md bg-zinc-700 text-white" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
