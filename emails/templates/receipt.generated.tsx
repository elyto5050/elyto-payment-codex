import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { SuccessBadge } from "@/emails/components/Badges";

export default function ReceiptGenerated({
  userName,
  receiptNumber,
  amount,
  paidAt,
  orderId
}: {
  userName: string;
  receiptNumber: string;
  amount: string;
  paidAt?: string;
  orderId?: string;
}) {
  return (
    <EmailLayout previewText={`Receipt ${receiptNumber} from Elyto`}>
      <EmailHeader title="Payment receipt" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />

      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SuccessBadge>Paid</SuccessBadge>
          <div style={{ flex: 1 }}>
            <Title>Payment received</Title>
            <MutedText>{userName}, we received your payment.</MutedText>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <MetadataTable rows={[
            { label: "Receipt", value: receiptNumber },
            { label: "Order", value: orderId ?? "—" },
            { label: "Amount", value: amount },
            { label: "Paid", value: paidAt ?? new Date().toISOString() }
          ]} />
        </div>

        <div style={{ marginTop: 12 }}>
          <BodyText>If you have questions about this payment, visit your billing dashboard.</BodyText>
        </div>
      </div>

      <EmailFooter />
    </EmailLayout>
  );
}
