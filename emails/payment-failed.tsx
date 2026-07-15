import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function PaymentFailedEmail({ orderId, reason }: { orderId: string; reason: string }) {
  return (
    <EmailLayout preview="Payment verification failed">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Payment verification failed</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
        Order <strong>{orderId}</strong> could not be verified. Reason: {reason}
      </Text>
    </EmailLayout>
  );
}
