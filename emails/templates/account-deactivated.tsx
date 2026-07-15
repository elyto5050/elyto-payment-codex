import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText } from "@/emails/components/Content";
import { ErrorBadge } from "@/emails/components/Badges";
import { PrimaryButton } from "@/emails/components/Buttons";

export default function AccountDeactivated({
  userName,
  deactivatedAt,
  reactivationUrl
}: {
  userName: string;
  deactivatedAt?: string;
  reactivationUrl?: string;
}) {
  return (
    <EmailLayout previewText={`Your Elyto account has been deactivated`}>
      <EmailHeader title="Account deactivated" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />

      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <ErrorBadge>Account</ErrorBadge>
          <div style={{ flex: 1 }}>
            <Title>Account deactivated</Title>
            <MutedText>{userName}, your account has been deactivated.</MutedText>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <BodyText>This action was taken on {deactivatedAt ?? new Date().toISOString()}.</BodyText>
        </div>

        <div style={{ marginTop: 18 }}>
          <PrimaryButton href={reactivationUrl ?? "#"}>Request reactivation</PrimaryButton>
        </div>

        <div style={{ marginTop: 12 }}>
          <BodyText>If you think this was an error, contact support and include your account email.</BodyText>
        </div>
      </div>

      <EmailFooter />
    </EmailLayout>
  );
}
