"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function AccountDeactivateModal({ isOpen, onClose, onConfirm, isLoading = false }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm mx-4 rounded-lg bg-[rgba(11,11,15,0.95)] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-base font-semibold text-white">Deactivate account</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/10 text-zinc-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-300">Deactivating your account will sign you out and hide your profile. You can reactivate later by signing in.</p>

          <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
            <p className="text-xs text-zinc-400">Your data will be retained and you may reactivate within the retention period.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={async () => { await onConfirm(); }} className="flex-1" disabled={isLoading}>
              {isLoading ? "Deactivating..." : "Deactivate account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
