import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function PasswordResetEmail({ url }: { url: string }) {
  return (
    <EmailLayout preview="Reset your Elyto password">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Reset your password</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>This link expires in 1 hour.</Text>
      <Button href={url} style={{ background: "#7C3AED", color: "#fff", padding: "12px 24px", borderRadius: "6px", marginTop: "16px" }}>
        Reset password
      </Button>
    </EmailLayout>
  );
}
