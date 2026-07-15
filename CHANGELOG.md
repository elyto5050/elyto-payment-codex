# Changelog

## Infrastructure and worker architecture refactor

### Worker/scheduler separation

- Replaced the single monolithic worker file with dedicated processor modules.
- Kept `workers/worker.ts` as the worker entrypoint.
- Kept `workers/scheduler.ts` as the scheduler entrypoint.
- Scheduler now runs as a long-lived process with health checks and periodic schedule reconciliation.
- Scheduler does not create BullMQ workers or consume queues.

Why: Railway can deploy worker and scheduler as separate background services. A scheduler crash no longer stops queue consumption, and a worker crash no longer prevents repeatable job registration.

### Queue modules

- Added queue names and runtime configuration under `workers/queues`.
- Added dedicated processors:
  - `workers/processors/payment/payment-worker.ts`
  - `workers/processors/gmail/gmail-worker.ts`
  - `workers/processors/webhook/webhook-worker.ts`
  - `workers/processors/analytics/analytics-worker.ts`
  - `workers/processors/billing/billing-worker.ts`
  - `workers/processors/account/account-worker.ts`
- Preserved existing queue names and payloads.

Why: processors now have independent concurrency, retry policy, logging, and error handling without breaking existing API producers.

### Retry and dead-letter queues

- Added exponential backoff defaults per queue.
- Added dead-letter queues:
  - `payment-failed`
  - `gmail-failed`
  - `webhook-failed`
  - `analytics-failed`
  - `billing-failed`
  - `account-failed`
- Dead-letter payloads include original queue, job id, job name, attempts, reason, and metadata.

Why: transient failures retry automatically; exhausted jobs are retained for recovery and investigation.

### Health and metrics

- Added `/health` and `/metrics` HTTP endpoints for worker and scheduler.
- Health checks validate Redis and PostgreSQL connectivity.
- Metrics report queue counts, Redis latency, database latency, uptime, memory, and CPU.

Why: Railway and external monitoring can detect stuck or degraded background services.

### Logging and security

- Replaced the basic JSON logger with a structured logger supporting `debug`, `info`, `warn`, and `error`.
- Added local colored logs and production JSON logs.
- Added recursive redaction for tokens, secrets, passwords, cookies, JWTs, authorization values, and session values.

Why: logs are safer for production and easier to search in hosted logging systems.

### Environment validation

- Added strict worker/scheduler startup validation with Zod.
- Required worker runtime settings now fail fast when missing.
- Added compatibility for either `WEBHOOK_SECRET` or existing `WEBHOOK_SECRET_PEPPER`.

Why: background services should fail at boot instead of failing after jobs are already queued.

### Redis/Prisma client lifecycle

- Added a worker Redis singleton.
- Reused the existing Prisma singleton.
- Removed a duplicate BullMQ queue client in Gmail sync-all flow.
- Added graceful shutdown for Redis, Prisma, BullMQ workers, BullMQ queues, and health servers.

Why: fewer duplicate clients reduces connection pressure on Upstash and Neon.

### Docker and Railway

- Replaced the existing Dockerfile with a production multi-stage Node Alpine image.
- Added Docker healthcheck.
- Added `docker-compose.yml` with web, worker, and scheduler services.
- Added `.dockerignore`.
- Added `railway.json` documenting worker and scheduler service commands and health checks.

Why: the same image can run web, worker, or scheduler commands in production.

### Documentation

- Added `DEPLOYMENT.md`.
- Added `WORKER.md`.
- Added `ARCHITECTURE.md`.
- Added `QUEUE_FLOW.md`.
- Added this changelog.

## Architecture review findings

### Fixed automatically

- Monolithic worker entrypoint mixed six queue processors in one file.
- Scheduler exited after registering repeatable jobs, making health checks impossible.
- Worker lacked health and metrics endpoints.
- Worker lacked graceful shutdown.
- Queue retry policy was inconsistent across producers.
- Permanent failures were not copied to dedicated dead-letter queues.
- Gmail sync-all created a duplicate BullMQ queue client and did not close it.
- Logger did not support debug logs, local color output, or sensitive value redaction.
- Existing `.env.example` contained unrelated stray text after the Sentry section.

### Not changed automatically

- Full `npm run typecheck` still fails on pre-existing app/test errors outside this infrastructure refactor:
  - React Query `isLoading` usage in admin tutorials.
  - Platform role comparison in admin tutorial route.
  - Dashboard notification/stats typing.
  - Auth provider typing.
  - Onboarding plan indexing.
  - Framer Motion transition typing.
  - Billing plan `as const` typing.
  - Project/tutorial service typing.
  - Verification failure reason typing.
  - Renewal test optional payment typing.
- `npm install` reports 12 dependency audit findings. Automated `npm audit fix --force` was not run because it can introduce breaking dependency changes.

These issues are safe candidates for a follow-up type-safety pass, but several touch UI/API code and were intentionally not mixed into this worker/deployment refactor.

## Verification

- `npm run worker` with `NODE_ENV=test`: passed. The entrypoint imports successfully and disables long-lived handles in test mode.
- `npm run typecheck`: failed only on pre-existing app/test type errors listed above; new worker modules did not report type errors after the BullMQ Redis connection type boundary was fixed.
- `npm run build`: Next compilation completed successfully, then static page generation failed with sandbox/network `EACCES` and `ETIMEDOUT` errors while collecting page data.
- `npm run prisma:generate`: passed after elevated filesystem permission was granted for Prisma to write generated client files under `node_modules`.
