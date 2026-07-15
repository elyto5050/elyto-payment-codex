"use client";

import { useEffect, useState } from "react";
import { X, Check, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-context";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const json = await res.json();
        const raw = json.notifications ?? (json.data?.notifications ?? json.data ?? []);
        const mapped = (raw || []).map((n: { id: string; title?: string; body?: string; createdAt?: string; readAt?: string | null }) => ({
          id: n.id,
          title: n.title ?? "",
          message: n.body ?? "",
          timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : "",
          read: !!n.readAt
        }));
        if (mounted) setNotifications(mapped);
      } catch (err) {
        // ignore
      }
    }

    load();

    const es = new EventSource("/api/notifications/stream");

    es.addEventListener("notification", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as unknown;
        let payloadVal: unknown;
        if (parsed && typeof parsed === "object" && "notification" in (parsed as Record<string, unknown>)) {
          payloadVal = (parsed as Record<string, unknown>).notification;
        } else {
          payloadVal = parsed;
        }

        const p = payloadVal as { id: string; title?: string; body?: string; createdAt?: string; readAt?: string | null };
        const n = {
          id: p.id,
          title: p.title ?? "",
          message: p.body ?? "",
          timestamp: p.createdAt ? new Date(p.createdAt).toLocaleString() : "",
          read: !!p.readAt
        };
        setNotifications((prev) => [n, ...prev]);
      } catch (err) {
        // ignore
      }
    });

    es.addEventListener("notificationUpdate", (e: MessageEvent) => {
      try {
        const update = JSON.parse(e.data) as { id: string; read?: boolean };
        setNotifications((prev) => prev.map((n) => (n.id === update.id ? { ...n, read: !!update.read } : n)));
      } catch (err) {}
    });

    es.addEventListener("markAllRead", () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))));

    return () => {
      mounted = false;
      es.close();
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        addToast("Marked as read", "success", 2000);
      }
    } catch (err) {
      addToast("Failed to mark read", "error", 3000);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        addToast("Marked all as read", "success", 2000);
      }
    } catch (err) {
      addToast("Failed to mark all read", "error", 3000);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        addToast("Deleted notification", "success", 2000);
      }
    } catch (err) {
      addToast("Failed to delete notification", "error", 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close modal" />

      {/* Modal Container - Centered with uniform padding */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-dense bg-[rgba(11,11,15,0.95)] border border-white/10 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[rgba(11,11,15,0.98)] px-6 py-4 backdrop-blur-md">
          <div>
            <h2 className="text-base font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && <p className="text-xs text-zinc-500 mt-1">{unreadCount} unread</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Bar */}
        {unreadCount > 0 && (
          <div className="border-b border-white/10 bg-white/[0.01] px-6 py-2">
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs text-cyan-300 hover:text-cyan-200">
              Mark all as read
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isExpanded={expandedId === notification.id}
                  onToggle={() => setExpandedId(expandedId === notification.id ? null : notification.id)}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 px-6">
              <p className="text-sm text-zinc-500 text-center">No notifications at this time</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification, isExpanded, onToggle, onMarkAsRead, onArchive }: { notification: Notification; isExpanded: boolean; onToggle: () => void; onMarkAsRead: (id: string) => void; onArchive: (id: string) => void; }) {
  return (
    <div className={`p-4 cursor-pointer transition-colors ${notification.read ? "bg-white/[0.01] hover:bg-white/[0.03]" : "bg-cyan-400/5 hover:bg-cyan-400/8"}`} onClick={onToggle}>
      <div className="flex items-start gap-3 mb-2">
        <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${notification.read ? "bg-zinc-600" : "bg-cyan-400"}`} />
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-white truncate">{notification.title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{notification.timestamp}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {!notification.read && (
            <button onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }} className="rounded-md p-1 hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors" title="Mark as read">
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onArchive(notification.id); }} className="rounded-md p-1 hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors" title="Archive">
            <Archive className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-5 mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-zinc-300 leading-relaxed">{notification.message}</p>
        </div>
      )}
    </div>
  );
}
