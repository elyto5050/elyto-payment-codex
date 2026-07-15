"use client";

import { useState } from "react";
import { X, Lock, Smartphone, Bell, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export function SettingsModal({ isOpen, onClose, userEmail }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"account" | "security" | "notifications">("account");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal Container - Centered with uniform padding */}
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-dense bg-[rgba(11,11,15,0.95)] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[rgba(11,11,15,0.98)] px-6 py-4 backdrop-blur-md z-10">
          <h2 className="text-base font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Sidebar Tabs */}
          <div className="w-32 border-r border-white/10 p-3 bg-white/[0.01]">
            <SettingsTab
              icon={<Shield className="h-4 w-4" />}
              label="Account"
              active={activeTab === "account"}
              onClick={() => setActiveTab("account")}
            />
            <SettingsTab
              icon={<Lock className="h-4 w-4" />}
              label="Security"
              active={activeTab === "security"}
              onClick={() => setActiveTab("security")}
            />
            <SettingsTab
              icon={<Bell className="h-4 w-4" />}
              label="Notifications"
              active={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
            />
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {activeTab === "account" && <AccountSettings userEmail={userEmail} />}
            {activeTab === "security" && <SecuritySettings />}
            {activeTab === "notifications" && <NotificationSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-dense px-3 py-2 text-xs font-medium transition-all mb-1 ${
        active
          ? "bg-cyan-400/10 border border-cyan-400/30 text-cyan-200"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function AccountSettings({ userEmail }: { userEmail?: string | null }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Account Information</h3>
        <div className="space-y-3">
          <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <label className="text-xs text-zinc-400 block mb-1">Email Address</label>
            <p className="text-sm text-white break-all">{userEmail || "Not set"}</p>
          </div>
          <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <label className="text-xs text-zinc-400 block mb-1">Account Status</label>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <p className="text-sm text-white">Active</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Workspace Details</h3>
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <label className="text-xs text-zinc-400 block mb-1">Plan Status</label>
          <p className="text-sm text-white">Free Sandbox</p>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Login History</h3>
        <p className="text-xs text-zinc-400 mb-3">Last 5 sessions</p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <SecurityLogEntry
            device="Chrome on Windows"
            location="India"
            timestamp="Today at 2:34 PM"
            current
          />
          <SecurityLogEntry device="Safari on macOS" location="United States" timestamp="3 days ago" />
          <SecurityLogEntry device="Chrome on Windows" location="India" timestamp="1 week ago" />
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <h3 className="text-sm font-semibold text-white mb-3">Active Sessions</h3>
        <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs text-zinc-400 mb-2">Current session</p>
          <p className="text-sm text-white">Chrome on Windows</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
        >
          <LogOut className="h-3 w-3 mr-2" />
          Log out from all other devices
        </Button>
      </div>
    </div>
  );
}

function SecurityLogEntry({
  device,
  location,
  timestamp,
  current = false,
}: {
  device: string;
  location: string;
  timestamp: string;
  current?: boolean;
}) {
  return (
    <div className="rounded-dense border border-white/10 bg-white/[0.02] p-2.5">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-medium text-white">{device}</p>
        {current && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300">Current</span>}
      </div>
      <p className="text-xs text-zinc-500">
        {location} • {timestamp}
      </p>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Notification Preferences</h3>
        <div className="space-y-3">
          <NotificationToggle label="Payment Verified" description="Receive alerts when payments are verified" defaultChecked />
          <NotificationToggle label="System Updates" description="Platform maintenance and feature announcements" defaultChecked />
          <NotificationToggle label="Webhook Events" description="Failed webhook deliveries and retries" defaultChecked />
          <NotificationToggle label="Security Alerts" description="Suspicious activity and login attempts" defaultChecked />
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-3 rounded-dense border border-white/10 bg-white/[0.02]">
      <div>
        <p className="text-xs font-medium text-white">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="rounded-sm w-4 h-4 cursor-pointer"
      />
    </div>
  );
}
