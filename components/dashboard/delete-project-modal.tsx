"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteProjectModalProps {
  isOpen: boolean;
  projectName: string;
  projectId: string;
  onClose: () => void;
  onConfirm: (projectId: string) => Promise<void>;
  isLoading?: boolean;
}

export function DeleteProjectModal({
  isOpen,
  projectName,
  projectId,
  onClose,
  onConfirm,
  isLoading = false
}: DeleteProjectModalProps) {
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  const isConfirmed = confirmText === projectName;

  const handleConfirm = async () => {
    if (isConfirmed) {
      await onConfirm(projectId);
      setConfirmText("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-lg bg-[rgba(11,11,15,0.95)] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[rgba(11,11,15,0.98)] px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <h2 className="text-base font-semibold text-white">Delete Project</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-zinc-300">
              This action cannot be undone. All data associated with <strong>{projectName}</strong> will be permanently deleted.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-2">
              Type the project name to confirm:
            </label>
            <Input
              type="text"
              placeholder={projectName}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <p className="text-xs text-red-300">
              ⚠️ This will delete the project, all products, orders, and API keys.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isConfirmed || isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete Project"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
