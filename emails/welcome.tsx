import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function WelcomeEmail({ name = "there" }: { name?: string }) {
  return (
    <EmailLayout preview="Welcome to Elyto">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Welcome to Elyto, {name}</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
        Your payment verification workspace is ready. Connect Gmail, create a project, and start automating fulfillment.
      </Text>
    </EmailLayout>
  );
}
