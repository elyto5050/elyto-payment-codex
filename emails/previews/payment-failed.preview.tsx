import React from "react";
import PaymentFailed from "@/emails/templates/payment-failed";

export default function Preview() {
  return (
    <PaymentFailed
      recipientName="Alex"
      orderId="ORD-12345"
      amount={499}
      currency="INR"
      reason="Amount mismatch"
      timestamp={new Date().toISOString()}
      orderUrl="https://example.com/dashboard/orders/ORD-12345"
      supportUrl="https://example.com/support"
    />
  );
}
