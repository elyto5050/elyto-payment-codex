import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { PrimaryButton } from "@/emails/components/Buttons";
import { SuccessBadge } from "@/emails/components/Badges";

export default function NewPaymentReceived({
  recipientName,
  amount,
  currency,
  customerRef,
  orderId,
  source,
  timestamp,
  paymentUrl,
  dashboardUrl
}: {
  recipientName: string;
  amount: number | string;
  currency: string;
  customerRef?: string;
  orderId?: string;
  source?: string;
  timestamp?: string;
  paymentUrl?: string;
  dashboardUrl?: string;
}) {
  return (
    <EmailLayout previewText={`New payment received — ${amount} ${currency}`}>
      <EmailHeader title="New payment received" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SuccessBadge>Received</SuccessBadge>
          <div style={{ flex: 1 }}>
            <Title>New payment received</Title>
            <MutedText>{recipientName}, a new payment was received in your account.</MutedText>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <BodyText>
            Amount: <strong>{amount} {currency}</strong>
          </BodyText>

          <MetadataTable rows={[
            { label: "Customer", value: customerRef ?? "—" },
            { label: "Order", value: orderId ?? "—" },
            { label: "Source", value: source ?? "—" },
            { label: "Received", value: timestamp ?? new Date().toISOString() }
          ]} />
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <PrimaryButton href={paymentUrl ?? dashboardUrl ?? "#"}>View Payment</PrimaryButton>
          <a href={dashboardUrl ?? "#"} style={{ display: "inline-block", padding: "8px 12px", color: "#0b5fff", textDecoration: "none" }}>Open Dashboard</a>
        </div>

        <MutedText style={{ marginTop: 12 }}>If this looks suspicious, please review the transaction and contact support immediately.</MutedText>
      </div>
      <EmailFooter />
    </EmailLayout>
  );
}
