# Elyto Architecture

Elyto is a payment verification SaaS built with Next.js, Prisma, PostgreSQL, BullMQ, Redis, Gmail OAuth, and background workers.

## Runtime boundaries

```text
Vercel Web
  -> accepts user/API requests
  -> writes application state to Neon
  -> enqueues BullMQ jobs in Upstash Redis

Railway Worker
  -> consumes BullMQ queues
  -> performs verification, sync, delivery, aggregation, billing, deletion
  -> writes results to Neon

Railway Scheduler
  -> registers repeatable BullMQ jobs
  -> does not consume queues
```

The worker and scheduler are intentionally independent. Either process can crash without directly stopping the other.

## Worker folder structure

```text
workers/
  processors/
    payment/
    gmail/
    webhook/
    analytics/
    billing/
    account/
  queues/
  lib/
  logger/
  monitoring/
  health/
  scheduler/
  types/
```

## Shared client strategy

- Prisma uses the existing singleton in `lib/db/prisma.ts`.
- Worker Redis uses a singleton in `workers/lib/redis.ts`.
- Queue producers in `lib/queues.ts` share retry policies from `workers/queues/config.ts`.

This avoids duplicate long-lived clients in worker and scheduler processes.

## Logging

`lib/logger.ts` now emits structured logs.

- Production: JSON logs.
- Local development: colored readable logs.
- Sensitive keys are redacted recursively, including tokens, secrets, passwords, cookies, JWTs, authorization headers, and session values.

Worker logs include queue context and job metadata when available.

## Monitoring

Worker and scheduler expose:

- `/health`
- `/metrics`

Tracked metrics:

- Queue size
- Completed jobs
- Failed jobs
- Processing jobs
- Process uptime
- Redis latency
- Database latency
- Memory usage
- CPU usage

## Compatibility

Existing queue names and job payload shapes are preserved. API producers continue using `lib/queues.ts`.
