import React from "react";
import { colors } from "@/emails/styles/tokens";

export function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ display: "inline-block", background: colors.brand, color: "white", padding: "10px 16px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
      {children}
    </a>
  );
}

export function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ display: "inline-block", background: "#f3f4f6", color: colors.text, padding: "8px 12px", borderRadius: 6, textDecoration: "none" }}>
      {children}
    </a>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ color: colors.brand, textDecoration: "underline" }}>{children}</a>
  );
}
