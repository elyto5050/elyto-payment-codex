import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { WarningBadge } from "@/emails/components/Badges";
import { PrimaryButton } from "@/emails/components/Buttons";

export default function WebhookDisabled({
  endpoint,
  disabledAt,
  enableUrl
}: {
  endpoint: string;
  disabledAt?: string;
  enableUrl?: string;
}) {
  return (
    <EmailLayout previewText={`Webhook disabled for ${endpoint}`}>
      <EmailHeader title="Webhook disabled" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />

      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <WarningBadge>Webhook</WarningBadge>
          <div style={{ flex: 1 }}>
            <Title>Webhook disabled</Title>
            <MutedText>Delivery to <strong>{endpoint}</strong> has been paused due to repeated failures.</MutedText>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <MetadataTable rows={[
            { label: "Endpoint", value: endpoint },
            { label: "Disabled at", value: disabledAt ?? new Date().toISOString() }
          ]} />
        </div>

        <div style={{ marginTop: 18 }}>
          <PrimaryButton href={enableUrl ?? "#"}>Re-enable webhook</PrimaryButton>
        </div>

        <div style={{ marginTop: 12 }}>
          <BodyText>If you re-enable, we'll attempt delivery again. Check logs for failure reasons.</BodyText>
        </div>
      </div>

      <EmailFooter />
    </EmailLayout>
  );
}
