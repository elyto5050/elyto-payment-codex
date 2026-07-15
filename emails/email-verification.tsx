import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function EmailVerificationEmail({ url }: { url: string }) {
  return (
    <EmailLayout preview="Verify your Elyto email">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Verify your email</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>Click below to verify your email address.</Text>
      <Button href={url} style={{ background: "#7C3AED", color: "#fff", padding: "12px 24px", borderRadius: "6px", marginTop: "16px" }}>
        Verify email
      </Button>
    </EmailLayout>
  );
}
