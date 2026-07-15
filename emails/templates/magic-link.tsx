import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, MutedText } from "@/emails/components/Content";
import { PrimaryButton, TextLink } from "@/emails/components/Buttons";

export default function MagicLinkEmail({ name, link, expiresAt, fallbackUrl }: { name: string; link: string; expiresAt: string; fallbackUrl?: string }) {
  return (
    <EmailLayout previewText={`Sign in to Elyto securely`}>
      <EmailHeader title="Sign in" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />
      <div style={{ padding: 24 }}>
        <Title>Sign in securely</Title>
        <BodyText>Hi {name}, click the button below to sign in to your Elyto account. This link expires soon.</BodyText>

        <div style={{ marginTop: 16 }}>
          <PrimaryButton href={link}>Sign In Securely</PrimaryButton>
        </div>

        <MutedText>Link expires at {expiresAt}. If the button doesn't work, copy and paste this URL into your browser:</MutedText>
        <div style={{ marginTop: 8 }}><TextLink href={fallbackUrl ?? link}>{fallbackUrl ?? link}</TextLink></div>

        <MutedText style={{ marginTop: 12 }}>If you did not request this sign-in, secure your account immediately.</MutedText>
      </div>
      <EmailFooter />
    </EmailLayout>
  );
}
