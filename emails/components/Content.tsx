import React from "react";
import { typography, spacing } from "@/emails/styles/tokens";

export function Title({ children }: { children: React.ReactNode }) {
  return <h1 style={{ margin: 0, ...typography.h1 }}>{children}</h1>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: 0, marginTop: spacing.xs, ...typography.h2 }}>{children}</h2>;
}

export function BodyText({ children }: { children: React.ReactNode }) {
  return <p style={{ marginTop: spacing.sm, marginBottom: spacing.sm, ...typography.body }}>{children}</p>;
}

export function MutedText({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ color: "#6b7280", fontSize: typography.caption.fontSize, ...(style ?? {}) }}>{children}</div>;
}

export function MetadataTable({ rows }: { rows: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: spacing.sm }}>
      <tbody>
        {rows.map((r) => (
          <tr key={String(r.label)}>
            <td style={{ padding: "6px 0", color: "#6b7280", width: 160 }}>{r.label}</td>
            <td style={{ padding: "6px 0", textAlign: "right", fontFamily: "monospace" }}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
