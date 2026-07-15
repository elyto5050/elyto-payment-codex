# Worker Runtime

The worker entrypoint is `workers/worker.ts`.

It starts one BullMQ worker for each production queue:

- `payment-verification`
- `gmail-sync`
- `webhook-delivery`
- `analytics`
- `billing`
- `account-deletion`

Each queue has a dedicated processor under `workers/processors/*` with its own concurrency, retry policy, logger context, and error handling.

## Health

The worker exposes:

```text
GET /health
GET /metrics
```

`/health` returns:

```json
{
  "status": "healthy",
  "queues": [],
  "redis": "connected",
  "database": "connected",
  "uptime": 1
}
```

`/metrics` includes queue counts, Redis latency, database latency, uptime, memory, and CPU usage.

## Retry behavior

- Payment verification: 5 attempts by default.
- Gmail sync: 3 attempts by default.
- Webhook delivery: 8 attempts by default.
- Analytics: 2 attempts by default.
- Billing: 3 attempts by default.
- Account deletion: 3 attempts by default.

All retry policies use exponential backoff. Values can be overridden through environment variables.

## Dead-letter queues

When a job exhausts its attempts, the worker writes a metadata payload to a dedicated failed queue:

- `payment-failed`
- `gmail-failed`
- `webhook-failed`
- `analytics-failed`
- `billing-failed`
- `account-failed`

The payload includes the original queue, original job id, job name, attempts made, failure reason, and original job data.

## Graceful shutdown

The worker handles:

- `SIGINT`
- `SIGTERM`

Shutdown closes:

- BullMQ workers
- dead-letter queues
- Redis
- Prisma
- health server

The shutdown timeout is 30 seconds.
