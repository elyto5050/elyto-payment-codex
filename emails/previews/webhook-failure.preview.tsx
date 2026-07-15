import React from "react";
import WebhookFailure from "@/emails/templates/webhook-failure";

export default function Preview() {
  return (
    <WebhookFailure
      endpoint="https://example.com/webhooks/receive"
      lastResponse="500 Internal Server Error"
      failedAt={new Date().toISOString()}
      retryUrl="https://example.com/dashboard/webhooks"
    />
  );
}
