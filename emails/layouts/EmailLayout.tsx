import React from "react";
import { colors, spacing } from "@/emails/styles/tokens";

export default function EmailLayout({ children, previewText }: { children: React.ReactNode; previewText?: string }) {
  return (
    <html>
      <body style={{ background: colors.background, color: colors.text, fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
        {previewText ? <div style={{ display: "none", fontSize: 1 }}>{previewText}</div> : null}
        <div style={{ width: "100%", padding: spacing.md, boxSizing: "border-box" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 2px rgba(2,6,23,0.06)" }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
