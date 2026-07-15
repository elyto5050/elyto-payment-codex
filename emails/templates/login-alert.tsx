import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { WarningBadge } from "@/emails/components/Badges";
import { PrimaryButton, TextLink } from "@/emails/components/Buttons";

export default function LoginAlert({
  userName,
  ip,
  location,
  device,
  time,
  signInUrl
}: {
  userName: string;
  ip?: string;
  location?: string;
  device?: string;
  time?: string;
  signInUrl?: string;
}) {
  return (
    <EmailLayout previewText={`New sign-in to your Elyto account`}>
      <EmailHeader title="New sign-in" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <WarningBadge>Notice</WarningBadge>
          <div style={{ flex: 1 }}>
            <Title>New sign-in to your account</Title>
            <MutedText>{userName}, we detected a new sign-in to your account.</MutedText>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <MetadataTable rows={[
            { label: "Time", value: time ?? new Date().toISOString() },
            { label: "IP", value: ip ?? "—" },
            { label: "Location", value: location ?? "—" },
            { label: "Device", value: device ?? "—" }
          ]} />
        </div>

        <div style={{ marginTop: 18 }}>
          <PrimaryButton href={signInUrl ?? "#"}>Secure this session</PrimaryButton>
        </div>

        <div style={{ marginTop: 12 }}>
          <BodyText>If this was you, you can safely ignore this message. <TextLink href="https://elyto.com/account/security">Manage sessions</TextLink></BodyText>
        </div>
      </div>
      <EmailFooter />
    </EmailLayout>
  );
}
