import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { SecurityBadge } from "@/emails/components/Badges";
import { PrimaryButton } from "@/emails/components/Buttons";

export default function SecurityAlert({
  userName,
  eventDescription,
  time,
  ip,
  location,
  device,
  reviewUrl,
  secureAccountUrl
}: {
  userName: string;
  eventDescription: string;
  time?: string;
  ip?: string;
  location?: string;
  device?: string;
  reviewUrl?: string;
  secureAccountUrl?: string;
}) {
  return (
    <EmailLayout previewText={`Security alert for your Elyto account`}>
      <EmailHeader title="Security alert" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SecurityBadge>Security</SecurityBadge>
          <div style={{ flex: 1 }}>
            <Title>Suspicious activity detected</Title>
            <MutedText>{userName}, we detected the following event: {eventDescription}</MutedText>
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

        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <PrimaryButton href={reviewUrl ?? "#"}>Review Activity</PrimaryButton>
          <a href={secureAccountUrl ?? "#"} style={{ display: "inline-block", padding: "8px 12px", color: "#0b5fff", textDecoration: "none" }}>Secure Account</a>
        </div>

        <MutedText style={{ marginTop: 12 }}>If this was not you, secure your account immediately and contact support.</MutedText>
      </div>
      <EmailFooter />
    </EmailLayout>
  );
}
