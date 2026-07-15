import React from "react";
import { colors } from "@/emails/styles/tokens";

export function SuccessBadge({ children }: { children: React.ReactNode }) {
  return <span style={{ background: colors.success, color: "white", padding: "6px 8px", borderRadius: 6, fontWeight: 600 }}>{children}</span>;
}

export function WarningBadge({ children }: { children: React.ReactNode }) {
  return <span style={{ background: colors.warning, color: "black", padding: "6px 8px", borderRadius: 6, fontWeight: 600 }}>{children}</span>;
}

export function ErrorBadge({ children }: { children: React.ReactNode }) {
  return <span style={{ background: colors.danger, color: "white", padding: "6px 8px", borderRadius: 6, fontWeight: 600 }}>{children}</span>;
}

export function SecurityBadge({ children }: { children: React.ReactNode }) {
  return <span style={{ background: "#0ea5e9", color: "white", padding: "6px 8px", borderRadius: 6, fontWeight: 600 }}>{children}</span>;
}
