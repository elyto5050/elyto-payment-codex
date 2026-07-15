import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function WebhookFailureEmail({ endpoint }: { endpoint: string }) {
  return (
    <EmailLayout preview="Webhook delivery failed">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Webhook delivery failed</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
        Elyto could not deliver an event to {endpoint}. We will retry using your configured retry policy.
      </Text>
    </EmailLayout>
  );
}
