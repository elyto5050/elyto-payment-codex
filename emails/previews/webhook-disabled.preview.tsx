import React from "react";
import WebhookDisabled from "@/emails/templates/webhook-disabled";

export default function Preview() {
  return (
    <WebhookDisabled
      endpoint="https://example.com/webhooks/receive"
      disabledAt="2026-06-12T12:00:00Z"
      enableUrl="https://example.com/dashboard/webhooks"
    />
  );
}
