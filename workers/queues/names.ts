export const QUEUE_NAMES = {
  payment: "payment-verification",
  gmail: "gmail-sync",
  webhook: "webhook-delivery",
  analytics: "analytics",
  billing: "billing",
  account: "account-deletion",
  notification: "notification"
} as const;

export const FAILED_QUEUE_NAMES = {
  payment: "payment-failed",
  gmail: "gmail-failed",
  webhook: "webhook-failed",
  analytics: "analytics-failed",
  billing: "billing-failed",
  account: "account-failed"
} as const;

export type QueueKey = keyof typeof FAILED_QUEUE_NAMES;

export const WORKER_QUEUE_NAMES = [
  QUEUE_NAMES.payment,
  QUEUE_NAMES.gmail,
  QUEUE_NAMES.webhook,
  QUEUE_NAMES.analytics,
  QUEUE_NAMES.billing,
  QUEUE_NAMES.account
] as const;
