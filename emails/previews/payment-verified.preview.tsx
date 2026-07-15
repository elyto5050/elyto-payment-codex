import React from "react";
import PaymentVerified from "@/emails/templates/payment-verified";

export default function Preview() {
  return (
    <PaymentVerified
      recipientName="Alex"
      amount={499}
      currency="INR"
      orderId="ORD-12345"
      productName="Premium Plan"
      source="gmail_fampay"
      timestamp={new Date().toISOString()}
      orderUrl="https://example.com/dashboard/orders/ORD-12345"
      dashboardUrl="https://example.com/dashboard"
    />
  );
}
