import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function SecurityAlertEmail({ message }: { message: string }) {
  return (
    <EmailLayout preview="Security alert for your Elyto account">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Security alert</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>{message}</Text>
      <Text style={{ color: "#a1a1aa", fontSize: "13px" }}>
        If this wasn&apos;t you, sign in and review your security settings immediately.
      </Text>
    </EmailLayout>
  );
}
