import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { PrimaryButton } from "@/emails/components/Buttons";

export default function OrganizationInvitation({
  inviterName,
  organizationName,
  role,
  invitationUrl,
  expiresAt
}: {
  inviterName: string;
  organizationName: string;
  role?: string;
  invitationUrl?: string;
  expiresAt?: string;
}) {
  return (
    <EmailLayout previewText={`You're invited to join ${organizationName} on Elyto`}>
      <EmailHeader title="Organization invitation" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />

      <div style={{ padding: 24 }}>
        <Title>{inviterName} invited you to join {organizationName}</Title>
        <MutedText>You were invited to join as {role ?? "Member"} on the organization.</MutedText>

        <div style={{ marginTop: 16 }}>
          <PrimaryButton href={invitationUrl ?? "#"}>Accept Invitation</PrimaryButton>
        </div>

        <div style={{ marginTop: 12 }}>
          <BodyText>If you don't recognize this invitation, ignore this email or contact support. Invitation expires: {expiresAt ?? "7 days"}.</BodyText>
        </div>

        <div style={{ marginTop: 16 }}>
          <MetadataTable rows={[
            { label: "Organization", value: organizationName },
            { label: "Role", value: role ?? "Member" },
            { label: "Invited by", value: inviterName }
          ]} />
        </div>
      </div>

      <EmailFooter />
    </EmailLayout>
  );
}
