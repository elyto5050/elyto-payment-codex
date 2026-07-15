import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function TeamInviteEmail({ organizationName, inviteUrl, role }: { organizationName: string; inviteUrl: string; role: string }) {
  return (
    <EmailLayout preview={`Join ${organizationName} on Elyto`}>
      <Heading style={{ color: "#fff", fontSize: "24px" }}>You&apos;re invited to {organizationName}</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
        You&apos;ve been invited as <strong>{role}</strong>. Accept the invite to join the workspace.
      </Text>
      <Button href={inviteUrl} style={{ background: "#7C3AED", color: "#fff", padding: "12px 24px", borderRadius: "6px", marginTop: "16px" }}>
        Accept invite
      </Button>
    </EmailLayout>
  );
}
