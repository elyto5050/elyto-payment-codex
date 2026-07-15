import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function MagicLinkEmail({ url }: { url: string }) {
  return (
    <EmailLayout preview="Sign in to Elyto">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Sign in to Elyto</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
        Click the button below to securely sign in. This link expires in 24 hours.
      </Text>
      <Button href={url} style={{ background: "#7C3AED", color: "#fff", padding: "12px 24px", borderRadius: "6px", marginTop: "16px" }}>
        Sign in to Elyto
      </Button>
    </EmailLayout>
  );
}
