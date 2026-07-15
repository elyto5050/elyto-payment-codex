import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { SuccessBadge } from "@/emails/components/Badges";
import { PrimaryButton, TextLink } from "@/emails/components/Buttons";

export default function ApiKeyGenerated({
  userName,
  keyName,
  createdAt,
  lastFour,
  revokeUrl,
  docsUrl
}: {
  userName: string;
  keyName?: string;
  createdAt?: string;
  lastFour?: string;
  revokeUrl?: string;
  docsUrl?: string;
}) {
  return (
    <EmailLayout previewText={`Your new Elyto API key is ready`}>
      <EmailHeader title="API key created" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />

      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SuccessBadge>API</SuccessBadge>
          <div style={{ flex: 1 }}>
            <Title>Your API key is ready</Title>
            <MutedText>{userName}, a new API key was generated for your account.</MutedText>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <MetadataTable rows={[
            { label: "Name", value: keyName ?? "Default" },
            { label: "Created", value: createdAt ?? new Date().toISOString() },
            { label: "Last 4", value: lastFour ?? "****" }
          ]} />
        </div>

        <div style={{ marginTop: 18 }}>
          <PrimaryButton href={revokeUrl ?? "#"}>Revoke key</PrimaryButton>
        </div>

        <div style={{ marginTop: 12 }}>
          <BodyText>Keep this key secure. This is the only time we'll show the full key. Learn more about best practices in our docs: <TextLink href={docsUrl ?? "https://elyto.com/docs/api-keys"}>API keys docs</TextLink></BodyText>
        </div>
      </div>

      <EmailFooter />
    </EmailLayout>
  );
}
