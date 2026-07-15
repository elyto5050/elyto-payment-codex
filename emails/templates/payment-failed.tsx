import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { ErrorBadge } from "@/emails/components/Badges";
import { PrimaryButton } from "@/emails/components/Buttons";

export default function PaymentFailed({
  recipientName,
  orderId,
  amount,
  currency,
  reason,
  timestamp,
  orderUrl,
  supportUrl
}: {
  recipientName: string;
  orderId: string;
  amount?: number | string;
  currency?: string;
  reason?: string;
  timestamp?: string;
  orderUrl?: string;
  supportUrl?: string;
}) {
  return (
    <EmailLayout previewText={`Payment failed for order ${orderId}`}>
      <EmailHeader title="Payment failed" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <ErrorBadge>Failed</ErrorBadge>
          <div style={{ flex: 1 }}>
            <Title>Payment failed</Title>
            <MutedText>{recipientName}, we couldn't verify the payment.</MutedText>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <BodyText>
            Amount: <strong>{amount ?? "—"} {currency ?? ""}</strong>
          </BodyText>

          <MetadataTable rows={[
            { label: "Order", value: orderId },
            { label: "Reason", value: reason ?? "Unknown" },
            { label: "Time", value: timestamp ?? new Date().toISOString() }
          ]} />
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <PrimaryButton href={orderUrl ?? "#"}>Retry Verification</PrimaryButton>
          <a href={supportUrl ?? "#"} style={{ display: "inline-block", padding: "8px 12px", color: "#0b5fff", textDecoration: "none" }}>Contact Support</a>
        </div>

        <MutedText style={{ marginTop: 12 }}>If you need assistance, visit our support page or respond to this email.</MutedText>
      </div>
      <EmailFooter />
    </EmailLayout>
  );
}
