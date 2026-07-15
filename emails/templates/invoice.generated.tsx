import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { PrimaryButton } from "@/emails/components/Buttons";

export default function InvoiceGenerated({
  userName,
  invoiceNumber,
  amount,
  dueDate,
  payUrl
}: {
  userName: string;
  invoiceNumber: string;
  amount: string;
  dueDate?: string;
  payUrl?: string;
}) {
  return (
    <EmailLayout previewText={`Invoice ${invoiceNumber} from Elyto`}>
      <EmailHeader title="Invoice issued" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />

      <div style={{ padding: 24 }}>
        <Title>Your invoice is ready</Title>
        <MutedText>{userName}, your invoice {invoiceNumber} for {amount} has been issued.</MutedText>

        <div style={{ marginTop: 16 }}>
          <MetadataTable rows={[
            { label: "Invoice", value: invoiceNumber },
            { label: "Amount", value: amount },
            { label: "Due", value: dueDate ?? "Net 30" }
          ]} />
        </div>

        <div style={{ marginTop: 18 }}>
          <PrimaryButton href={payUrl ?? "#"}>Pay Invoice</PrimaryButton>
        </div>

        <div style={{ marginTop: 12 }}>
          <BodyText>If you have questions about this invoice, visit your billing dashboard or contact support.</BodyText>
        </div>
      </div>

      <EmailFooter />
    </EmailLayout>
  );
}
