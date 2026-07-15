import React from "react";
import { spacing } from "@/emails/styles/tokens";

export default function EmailFooter({ showLinks = true }: { showLinks?: boolean }) {
  return (
    <div style={{ padding: spacing.md, borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#6b7280" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>Elyto</div>
          <div style={{ marginTop: 6 }}>© {new Date().getFullYear()} Elyto</div>
        </div>
        {showLinks ? (
          <div style={{ textAlign: "right" }}>
            <div><a href="/dashboard">Dashboard</a></div>
            <div><a href="/docs">Docs</a></div>
            <div><a href="/support">Support</a></div>
            <div><a href="/status">Status</a></div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
