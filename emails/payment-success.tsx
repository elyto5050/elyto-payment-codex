import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export default function PaymentSuccessEmail({ orderId, amount }: { orderId: string; amount: string }) {
  return (
    <EmailLayout preview="Payment verified">
      <Heading style={{ color: "#fff", fontSize: "24px" }}>Payment verified</Heading>
      <Text style={{ color: "#d4d4d8", lineHeight: "24px" }}>
        Order <strong>{orderId}</strong> for {amount} has been verified and marked as paid.
      </Text>
    </EmailLayout>
  );
}
