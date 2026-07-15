# Queue Flow

## Payment verification

```text
API/Gmail sync
  -> payment-verification: verify-order { orderPublicId }
  -> payment processor
  -> verifyOrderByUtr()
  -> webhook-delivery job when order is verified/failed
```

Permanent failures go to `payment-failed`.

## Gmail sync

```text
scheduler
  -> gmail-sync: sync-all
  -> gmail processor
  -> syncAllGmailConnections()
  -> gmail-sync: sync { gmailConnectionId }
  -> syncGmailConnection()
  -> payment-verification jobs for matched pending orders
```

Permanent failures go to `gmail-failed`.

## Webhook delivery

```text
verification service
  -> webhook-delivery: deliver { eventId }
  -> webhook processor
  -> deliverWebhookEvent()
  -> endpoint delivery records updated
```

Permanent failures go to `webhook-failed`.

## Analytics

```text
scheduler
  -> analytics: aggregate-daily
  -> analytics processor
  -> aggregateDailyMetrics()
```

Permanent failures go to `analytics-failed`.

## Billing

```text
scheduler
  -> billing: reset-subscriptions
  -> billing processor
  -> resetDueSubscriptionsUsage()
```

Permanent failures go to `billing-failed`.

## Account deletion

```text
account service
  -> account-deletion: delete-user { userId }
  -> account processor
  -> permanentlyDeleteAccount()
```

Permanent failures go to `account-failed`.

## Scheduler responsibilities

The scheduler only creates repeatable jobs:

- Gmail sync every 10 minutes by default.
- Analytics daily at 00:00 UTC by default.
- Billing reset daily at 02:00 UTC by default.

It never consumes queues.
