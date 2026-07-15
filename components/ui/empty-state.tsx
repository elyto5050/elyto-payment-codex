import { FileText, Folder, Inbox } from "lucide-react";

export default function EmptyState({ title, description, icon = "file" }: { title: string; description?: string; icon?: "file" | "folder" | "inbox" }) {
  const Icon = icon === "folder" ? Folder : icon === "inbox" ? Inbox : FileText;
  return (
    <div className="py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-zinc-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      {description ? <p className="mt-2 text-xs text-zinc-500">{description}</p> : null}
    </div>
  );
}
