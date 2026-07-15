import React from "react";
import InvoiceGenerated from "@/emails/templates/invoice.generated";

export default function Preview() {
  return (
    <InvoiceGenerated
      userName="Anya"
      invoiceNumber="INV-2026-0001"
      amount="$199.00"
      dueDate="2026-07-12"
      payUrl="https://example.com/billing/invoices/INV-2026-0001"
    />
  );
}
