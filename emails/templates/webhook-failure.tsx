import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { ErrorBadge } from "@/emails/components/Badges";
import { PrimaryButton } from "@/emails/components/Buttons";

export default function WebhookFailure({
  endpoint,
  lastResponse,
  failedAt,
  retryUrl
}: {
  endpoint: string;
  lastResponse?: string;
  failedAt?: string;
  retryUrl?: string;
}) {
  return (
    <EmailLayout previewText={`Webhook delivery failure for ${endpoint}`}>
      <EmailHeader title="Webhook failure" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />

      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <ErrorBadge>Webhook</ErrorBadge>
          <div style={{ flex: 1 }}>
            <Title>Delivery failed</Title>
            <MutedText>We couldn't deliver a webhook to <strong>{endpoint}</strong>.</MutedText>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <MetadataTable rows={[
            { label: "Endpoint", value: endpoint },
            { label: "Last response", value: lastResponse ?? "—" },
            { label: "Failed at", value: failedAt ?? new Date().toISOString() }
          ]} />
        </div>

        <div style={{ marginTop: 18 }}>
          <PrimaryButton href={retryUrl ?? "#"}>Retry delivery</PrimaryButton>
        </div>

        <div style={{ marginTop: 12 }}>
          <BodyText>If this issue continues, check your endpoint or contact support.</BodyText>
        </div>
      </div>

      <EmailFooter />
    </EmailLayout>
  );
}
