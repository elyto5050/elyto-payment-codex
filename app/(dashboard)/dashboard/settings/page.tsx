"use client";

import { useState } from "react";
import apiFetch from "@/lib/api/client";
import { Bell, Brush, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-context";
import { AccountDeactivateModal } from "@/components/dashboard/account-deactivate-modal";
import { AccountDeleteModal } from "@/components/dashboard/account-delete-modal";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardCard } from "@/components/dashboard/card-components";
import GeneralProfile from "./profile-client";

type Tab = "general" | "preferences" | "notifications" | "danger";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Settings"
        description="Manage profile details, preferences, notification behavior, and account lifecycle controls."
      />

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <div className="lg:sticky lg:top-24 h-fit space-y-1">
          <TabButton active={tab === "general"} icon={<UserRound className="h-3 w-3" />} label="General" onClick={() => setTab("general")} />
          <TabButton active={tab === "preferences"} icon={<Brush className="h-3 w-3" />} label="Preferences" onClick={() => setTab("preferences")} />
          <TabButton active={tab === "notifications"} icon={<Bell className="h-3 w-3" />} label="Notifications" onClick={() => setTab("notifications")} />
          <TabButton active={tab === "danger"} icon={<Trash2 className="h-3 w-3" />} label="Danger zone" onClick={() => setTab("danger")} danger />
        </div>

        <div>
          {tab === "general" ? <GeneralProfile /> : null}
          {tab === "preferences" ? <PreferencesTab /> : null}
          {tab === "notifications" ? <NotificationsTab /> : null}
          {tab === "danger" ? <DangerTab /> : null}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick, danger }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-dense border px-2 py-1.5 text-left text-xs transition-colors h-7 ${
        active
          ? danger
            ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
            : "border-cyan-400/25 bg-cyan-400/10 text-cyan-100"
          : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-100"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

function PreferencesTab() {
  const [theme, setTheme] = useState<string>(typeof window !== "undefined" ? localStorage.getItem("theme") ?? "system" : "system");

  function apply(nextTheme: string) {
    setTheme(nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {}
    const root = document.documentElement;
    if (nextTheme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }

  return (
    <DashboardCard title="Preferences" subtitle="Choose how Elyto should render">
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-400">Theme</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {["light", "dark", "system"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => apply(item)}
              className={`rounded-dense border p-2 text-left text-xs capitalize transition-colors h-8 ${theme === item ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

function NotificationsTab() {
  return (
    <DashboardCard title="Notification preferences" subtitle="Control notification delivery">
      <div className="space-y-2">
        <Preference label="Payment verification" copy="Order alerts and verification status" />
        <Preference label="Webhook delivery" copy="Endpoint failures and retries" />
        <Preference label="Security alerts" copy="Login attempts and account events" />
      </div>
    </DashboardCard>
  );
}

function Preference({ label, copy }: { label: string; copy: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-dense border border-white/10 bg-white/[0.02] p-2">
      <div>
        <p className="text-xs font-medium text-white">{label}</p>
        <p className="text-[11px] text-zinc-500 mt-0.5">{copy}</p>
      </div>
      <div className="h-5 w-8 rounded-full bg-cyan-400/20 p-0.5 flex-shrink-0">
        <div className="ml-auto h-3.5 w-3.5 rounded-full bg-cyan-200" />
      </div>
    </div>
  );
}

function DangerTab() {
  const { addToast } = useToast();
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isProcessingDeactivate, setProcessingDeactivate] = useState(false);
  const [isProcessingDelete, setProcessingDelete] = useState(false);

  async function handleDeactivateConfirm() {
    setProcessingDeactivate(true);
    try {
      await apiFetch("/api/dashboard/account/deactivate", { method: "POST" });
      addToast("Account deactivated", "success");
      // Sign out / redirect to login
      window.location.href = "/login?deactivated=1";
    } catch (err) {
      addToast("Failed to deactivate account", "error");
    } finally {
      setProcessingDeactivate(false);
      setDeactivateOpen(false);
    }
  }

  async function handleDeleteConfirm() {
    setProcessingDelete(true);
    try {
      const json = await apiFetch("/api/dashboard/account/delete", { method: "POST" }) as any;
      if (json.scheduled) addToast("Account deletion scheduled", "success");
      else if (json.deleted) addToast("Account deleted", "success");
      window.location.href = "/";
    } catch (err) {
      addToast("Failed to delete account", "error");
    } finally {
      setProcessingDelete(false);
      setDeleteOpen(false);
    }
  }

  function handleExport() {
    addToast("Preparing data export", "info");
    // Trigger browser download
    window.location.href = "/api/dashboard/account/export";
  }

  async function handleReactivate() {
    try {
      await apiFetch("/api/dashboard/account/reactivate", { method: "POST" });
      addToast("Account reactivated", "success");
      // refresh page
      window.location.reload();
    } catch (err) {
      addToast("Failed to reactivate account", "error");
    }
  }

  return (
    <>
      <DashboardCard title="Danger zone" subtitle="Irreversible account actions">
        <div className="space-y-3 text-xs">
          <p className="text-zinc-400">Deactivate or delete your account. These actions affect access and data.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" className="h-7 text-xs rounded-dense" onClick={() => setDeactivateOpen(true)}>Deactivate</Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs rounded-dense" onClick={() => setDeleteOpen(true)}>Delete</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-dense" onClick={handleExport}>Export my data</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-dense" onClick={handleReactivate}>Reactivate</Button>
          </div>
        </div>
      </DashboardCard>

      <AccountDeactivateModal isOpen={deactivateOpen} onClose={() => setDeactivateOpen(false)} onConfirm={handleDeactivateConfirm} isLoading={isProcessingDeactivate} />
      <AccountDeleteModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteConfirm} isLoading={isProcessingDelete} />
    </>
  );
}
