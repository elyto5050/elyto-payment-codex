import React from "react";
import EmailLayout from "@/emails/layouts/EmailLayout";
import EmailHeader from "@/emails/components/Header";
import EmailFooter from "@/emails/components/Footer";
import { Title, BodyText, Subtitle, MetadataTable } from "@/emails/components/Content";
import { PrimaryButton, TextLink } from "@/emails/components/Buttons";

export default function WelcomeEmail({ name, dashboardUrl, docsUrl, createProjectUrl, connectGmailUrl }: { name: string; dashboardUrl: string; docsUrl: string; createProjectUrl: string; connectGmailUrl: string }) {
  return (
    <EmailLayout previewText={`Welcome to Elyto, ${name}` }>
      <EmailHeader title="Welcome" environment={process.env.NODE_ENV === "development" ? "dev" : "prod"} />
      <div style={{ padding: 24 }}>
        <Title>Welcome to Elyto, {name}</Title>
        <BodyText>Thanks for signing up. Elyto helps you accept and verify payments quickly and securely.</BodyText>

        <div style={{ marginTop: 16 }}>
          <PrimaryButton href={dashboardUrl}>Open Dashboard</PrimaryButton>
        </div>

        <Subtitle>Getting started</Subtitle>
        <ul>
          <li><TextLink href={createProjectUrl}>Create a project</TextLink></li>
          <li><TextLink href={connectGmailUrl}>Connect Gmail</TextLink></li>
          <li><TextLink href={docsUrl}>Read the docs</TextLink></li>
        </ul>

        <Subtitle>Useful resources</Subtitle>
        <BodyText>Need help? Visit our <TextLink href="/support">support</TextLink> or check the <TextLink href={docsUrl}>documentation</TextLink>.</BodyText>

        <MetadataTable rows={[{ label: "Account", value: name }]} />
      </div>
      <EmailFooter />
    </EmailLayout>
  );
}
