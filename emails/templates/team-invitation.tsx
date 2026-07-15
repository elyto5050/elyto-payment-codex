import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText, MetadataTable } from "@/emails/components/Content";
import { PrimaryButton, TextLink } from "@/emails/components/Buttons";

export default function TeamInvitation({
  inviterName,
  teamName,
  role,
  invitationUrl,
  expiresAt
}: {
  inviterName: string;
  teamName: string;
  role?: string;
  invitationUrl?: string;
  expiresAt?: string;
}) {
  return (
    <EmailLayout previewText={`You're invited to join ${teamName} on Elyto`}>
      <EmailHeader title="Team invitation" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />

      <div style={{ padding: 24 }}>
        <Title>{inviterName} invited you to join {teamName}</Title>
        <MutedText>You were invited to join as {role ?? "Member"}.</MutedText>

        <div style={{ marginTop: 16 }}>
          <PrimaryButton href={invitationUrl ?? "#"}>Accept Invitation</PrimaryButton>
        </div>

        <div style={{ marginTop: 12 }}>
          <BodyText>If you didn't expect this invite, you can ignore this email or contact the inviter. Invitation expires: {expiresAt ?? "7 days"}.</BodyText>
        </div>

        <div style={{ marginTop: 16 }}>
          <MetadataTable rows={[
            { label: "Team", value: teamName },
            { label: "Role", value: role ?? "Member" },
            { label: "Invited by", value: inviterName }
          ]} />
        </div>
      </div>

      <EmailFooter />
    </EmailLayout>
  );
}
