import React from "react";
import { Img } from "@react-email/components";
import { spacing } from "@/emails/styles/tokens";

const logoUrl = process.env.NEXT_PUBLIC_EMAIL_LOGO_URL ?? "https://i.ibb.co/RpVR1WTg/logo.png";

export default function EmailHeader({ title, environment }: { title?: string; environment?: "dev" | "prod" | "staging" }) {
  return (
    <div style={{ padding: spacing.md, borderBottom: `1px solid #f1f5f9`, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Img src={logoUrl} alt="Elyto" width="40" height="40" style={{ borderRadius: 4 }} />
        <div>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>Elyto</div>
          {title ? <div style={{ fontSize: 12, color: "#6b7280" }}>{title}</div> : null}
        </div>
      </div>
      <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>{environment === "dev" ? <span style={{ background: "#f3f4f6", padding: "4px 8px", borderRadius: 6 }}>Development</span> : null}</div>
    </div>
  );
}
