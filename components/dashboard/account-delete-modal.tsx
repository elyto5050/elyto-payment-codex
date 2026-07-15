"use client";

import { X, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function AccountDeleteModal({ isOpen, onClose, onConfirm, isLoading = false }: Props) {
  const [confirmText, setConfirmText] = useState("");
  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === "DELETE";

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    await onConfirm();
    setConfirmText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm mx-4 rounded-lg bg-[rgba(11,11,15,0.95)] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <h2 className="text-base font-semibold text-white">Delete account</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/10 text-zinc-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-300">Deleting your account is irreversible. All personal data, projects, and billing records will be scheduled for deletion.</p>

          <div>
            <label className="block text-xs font-semibold text-white mb-2">Type DELETE to confirm</label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE to confirm" />
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <p className="text-xs text-red-300">⚠️ This will schedule permanent deletion. You will be signed out immediately.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={handleConfirm} className="flex-1" disabled={!isConfirmed || isLoading}>
              {isLoading ? "Deleting..." : "Delete account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
