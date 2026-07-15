import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { PrimaryButton } from "@/emails/components/Buttons";
import { SuccessBadge } from "@/emails/components/Badges";

export default function PaymentVerified({
  recipientName,
  amount,
  currency,
  orderId,
  productName,
  source,
  timestamp,
  orderUrl,
  dashboardUrl
}: {
  recipientName: string;
  amount: number | string;
  currency: string;
  orderId: string;
  productName?: string;
  source?: string;
  timestamp?: string;
  orderUrl?: string;
  dashboardUrl?: string;
}) {
  return (
    <EmailLayout previewText={`Payment verified — ${amount} ${currency}`}>
      <EmailHeader title="Payment verified" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SuccessBadge>Verified</SuccessBadge>
          <div style={{ flex: 1 }}>
            <Title>Payment verified</Title>
            <MutedText>{recipientName}, we successfully verified a payment.</MutedText>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <BodyText>
            Amount: <strong>{amount} {currency}</strong>
          </BodyText>

          <MetadataTable rows={[
            { label: "Order", value: orderId },
            { label: "Product", value: productName ?? "—" },
            { label: "Source", value: source ?? "—" },
            { label: "Time", value: timestamp ?? new Date().toISOString() }
          ]} />
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <PrimaryButton href={orderUrl ?? dashboardUrl ?? "#"}>Open Dashboard</PrimaryButton>
          <a href={orderUrl ?? "#"} style={{ display: "inline-block", padding: "8px 12px", color: "#0b5fff", textDecoration: "none" }}>View Order</a>
        </div>
      </div>
      <EmailFooter />
    </EmailLayout>
  );
}
