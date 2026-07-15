import React from "react";
import ReceiptGenerated from "@/emails/templates/receipt.generated";

export default function Preview() {
  return (
    <ReceiptGenerated
      userName="Sam"
      receiptNumber="RCPT-2026-1001"
      amount="$49.00"
      paidAt={new Date().toISOString()}
      orderId="ORD-2026-2001"
    />
  );
}
