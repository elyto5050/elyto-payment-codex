import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText } from "@/emails/components/Content";
import { PrimaryButton, TextLink } from "@/emails/components/Buttons";

export default function VerifyEmail({ name, verifyUrl, expiresAt, fallbackUrl }: { name: string; verifyUrl: string; expiresAt: string; fallbackUrl?: string }) {
  return (
    <EmailLayout previewText={`Verify your email to finish setting up your Elyto account`}>
      <EmailHeader title="Email verification" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />
      <div style={{ padding: 24 }}>
        <Title>Verify your email</Title>
        <BodyText>Hi {name}, please verify your email address to activate your account.</BodyText>

        <div style={{ marginTop: 16 }}>
          <PrimaryButton href={verifyUrl}>Verify Email</PrimaryButton>
        </div>

        <MutedText>Link expires at {expiresAt}. If the button doesn't work, copy and paste this URL into your browser:</MutedText>
        <div style={{ marginTop: 8 }}><TextLink href={fallbackUrl ?? verifyUrl}>{fallbackUrl ?? verifyUrl}</TextLink></div>

        <MutedText style={{ marginTop: 12 }}>If you did not request this, you can safely ignore this email. For security, do not share this link.</MutedText>
      </div>
      <EmailFooter />
    </EmailLayout>
  );
}
