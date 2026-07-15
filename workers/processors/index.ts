import { startAccountWorker } from "@/workers/processors/account/account-worker";
import { startAnalyticsWorker } from "@/workers/processors/analytics/analytics-worker";
import { startBillingWorker } from "@/workers/processors/billing/billing-worker";
import { startGmailWorker } from "@/workers/processors/gmail/gmail-worker";
import { startPaymentWorker } from "@/workers/processors/payment/payment-worker";
import { startWebhookWorker } from "@/workers/processors/webhook/webhook-worker";

export function startAllWorkers() {
  return [
    startPaymentWorker(),
    startGmailWorker(),
    startWebhookWorker(),
    startAnalyticsWorker(),
    startBillingWorker(),
    startAccountWorker()
  ];
}
