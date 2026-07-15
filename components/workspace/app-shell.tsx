"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Bell,
  CreditCard,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MailCheck,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Sparkles,
  UserRound,
  Webhook,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/dashboard/settings-modal";
import { NotificationsModal } from "@/components/dashboard/notifications-modal";
import { cn } from "@/lib/utils";

export type ShellLink = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  ownerOnly?: boolean;
};

const ICONS = {
  overview: LayoutDashboard,
  projects: FolderKanban,
  products: Package,
  orders: ShoppingCart,
  gmail: MailCheck,
  api: KeyRound,
  webhooks: Webhook,
  analytics: Sparkles,
  notifications: Bell,
  billing: CreditCard,
  support: LifeBuoy,
  security: Shield,
  settings: Settings,
  users: UserRound
};

export function WorkspaceShell({
  children,
  title,
  description,
  links,
  variant,
  userName,
  userEmail,
  workspaceLabel,
  canAccessOwnerControls = false
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  links: ShellLink[];
  variant: "dashboard" | "admin";
  userName?: string | null;
  userEmail?: string | null;
  workspaceLabel: string;
  canAccessOwnerControls?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const json = await res.json();
        const raw = json.notifications ?? (json.data?.notifications ?? json.data ?? []);
        const unread = (raw || []).filter((n: { readAt?: string | null }) => !n.readAt).length;
        if (mounted) setUnreadCount(unread);
      } catch (e) {
        // ignore
      }
    }

    load();

    const es = new EventSource("/api/notifications/stream");
    es.addEventListener("notification", () => setUnreadCount((v) => v + 1));
      es.addEventListener("notificationUpdate", (e: MessageEvent) => {
      try {
          const update = JSON.parse(e.data) as { id?: string; read?: boolean };
        if (update.read) setUnreadCount((v) => Math.max(0, v - 1));
      } catch (err) {
        // ignore
      }
    });
    es.addEventListener("markAllRead", () => setUnreadCount(0));

    return () => {
      mounted = false;
      es.close();
    };
  }, []);

  const visibleLinks = links.filter((link) => !link.ownerOnly || canAccessOwnerControls);
  const displayIdentity = userName || (userEmail ? userEmail.substring(0, 8) : "User");

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_22%),linear-gradient(180deg,#050505_0%,#09090b_45%,#050505_100%)] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 border-r border-white/10 bg-[rgba(11,11,15,0.82)] flex flex-col shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-200 overflow-hidden",
          collapsed ? "w-20" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Logo size={32} withText={!collapsed} />
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-full border border-white/10 p-1.5 text-zinc-300 hidden lg:inline-flex hover:bg-white/5"
                aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>

              <button
                className="rounded-full border border-white/10 p-1.5 text-zinc-300 lg:hidden hover:bg-white/5"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto pr-2 py-3 space-y-1 hover:pr-0 scrollbar-hide">
            {visibleLinks.map((link) => {
              const Icon = ICONS[link.icon];
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "mx-2 flex items-center gap-2 rounded-dense px-2.5 py-2 text-sm transition-all duration-200",
                    collapsed ? "justify-center" : "",
                    active
                      ? "border-cyan-400/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(255,255,255,0.05))] text-cyan-200"
                      : "border-transparent bg-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className={cn("truncate font-medium", collapsed ? "sr-only" : "")}>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3 bg-white/[0.02]">
            <div className="rounded-dense border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 mb-2">
                <button
                  className="rounded-md p-1 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Notifications"
                  onClick={() => setNotificationsOpen(true)}
                >
                  <Bell className="h-4 w-4" />
                </button>
                <button
                  className="rounded-md p-1 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Settings"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              <p className={cn("text-xs font-semibold text-zinc-100 truncate", collapsed ? "sr-only" : "")}>{displayIdentity}</p>
              <p className={cn("text-xs text-zinc-500 truncate mt-0.5", collapsed ? "sr-only" : "")}>{userEmail || "Authenticated"}</p>

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "mt-2 w-full justify-start rounded-dense border-white/10 bg-white/[0.02] px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06]",
                  collapsed ? "hidden" : ""
                )}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-3 w-3 mr-1.5" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-black/55 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className={cn("flex-1 flex flex-col", collapsed ? "lg:ml-20" : "lg:ml-60")}> 
        <header className="sticky top-0 z-20 border-b border-white/8 bg-[rgba(5,5,5,0.72)] px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-4 max-w-7xl mx-auto">
            <button
              className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:hidden hover:bg-white/[0.06]"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{variant === "admin" ? "Owner Console" : "Dashboard"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-base font-semibold tracking-tight text-white">{title}</h1>
                <span className="hidden h-0.5 w-0.5 rounded-full bg-zinc-600 sm:inline-block" />
                <p className="text-sm text-zinc-400">{description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="relative rounded-md p-1 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Notifications"
                onClick={() => setNotificationsOpen(true)}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-[10px] px-1.5 py-0.5 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-6 py-6 w-full">{children}</main>

        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} userEmail={userEmail} />
        <NotificationsModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      </div>
    </div>
  );
}
