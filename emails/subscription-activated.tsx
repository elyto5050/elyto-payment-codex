import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function SubscriptionActivatedEmail({ planName, limits, renewalDate }: { planName: string; limits: string; renewalDate?: string | null }) {
  return (
    <EmailLayout preview="Subscription activated">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Subscription Activated</Heading>
      <Section style={{ marginTop: "8px" }}>
        <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
          Your subscription <strong>{planName}</strong> is now active. Your limits: {limits}.
        </Text>
        {renewalDate && (
          <Text style={{ color: "#d4d4d8", lineHeight: "24px", marginTop: "8px" }}>
            Renewal date: <strong>{renewalDate}</strong>
          </Text>
        )}
      </Section>
    </EmailLayout>
  );
}
