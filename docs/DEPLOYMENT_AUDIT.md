# Deployment & Operations Guide — Elyto

This document summarizes the production architecture, operational responsibilities, and runbook-level guidance for the Elyto payment platform. It focuses on the areas you requested: Overview, Products, Orders, Gmail sync limits, Analytics, Webhooks, API Keys, and Security.

## Overview
- Stack: Next.js (App Router) frontend + server routes, TypeScript, Tailwind; Prisma ORM with PostgreSQL; Redis + BullMQ for background jobs; long-running Workers (workers/worker.ts) and Scheduler (workers/scheduler.ts); Resend for transactional email; Google OAuth/Gmail sync for inbound parsing; NextAuth for auth.
- Key runtime responsibilities:
  - HTTP server handles user-facing pages and API routes (billing, webhooks, onboarding).
  - Background workers process payment verifications, Gmail syncs, webhook deliveries, analytics aggregation.
  - Scheduler enqueues periodic jobs (gmail-sync every 10m, analytics daily, billing resets daily@02:00 UTC).
- Single-source-of-truth for pricing/plan metadata: `lib/plans.ts` (server-authoritative). All checkout / SubscriptionPayment creation must use that file.

## Products (Plans)
- Canonical plan metadata lives in `lib/plans.ts`. Treat this as the only place that defines:
  - Price amounts
  - Plan keys/tier ids
  - Default quotas and support levels
- Behavior rules:
  - The server is authoritative for price and plan validation. Client-side selections are UI state only; creation of a `SubscriptionPayment` record (status `PENDING`) must always use the plan data from `lib/plans.ts`.
  - Do not duplicate plan constants in multiple files or templates. If you must reference a plan in UI, read the plan metadata from an API that returns the canonical definition.

## Orders & Checkout Flow
- Flow summary:
  1. User finishes onboarding and selects a plan (client-side only).
  2. UI POSTs to `/api/dashboard/billing/checkout` (server) which creates a `SubscriptionPayment` row with `status = "PENDING"`, canonical `planTier` and `amount` taken from `lib/plans.ts` (not from client payload).
  3. Server returns a `paymentRef` (and minimal metadata) which the client stores locally (e.g., `localStorage.selectedPlan` + `localStorage.pendingPaymentRef`).
  4. Checkout page reads the pending payment from `/api/dashboard/billing/payment` to display authoritative plan/amount and to proceed with payment verification.
  5. Payment verification is handled by a worker listening to `payment-verification` queue (or an endpoint that verifies and updates the `SubscriptionPayment` to `VERIFIED`).
- Data model notes:
  - Prisma model `SubscriptionPayment` includes: `userId`, `planTier`, `amount` (Decimal), `paymentRef` (unique), `status` (PENDING/VERIFIED/FAILED), `expiresAt`.
  - Always use the DB row (PENDING record) for final amount/plan checks. The UI may show a preflight preview but must validate against DB before charging or enabling features.

## Gmail sync & limits
- Current scheduler: `gmail-sync` job runs every 10 minutes. This is a reasonable starting cadence but must be tuned against Gmail API quotas.
- Gmail API considerations:
  - Use incremental sync via `historyId` to avoid re-fetching the entire mailbox.
  - Respect Gmail quota headers and handle 429s with exponential backoff and jitter.
  - Implement per-connection rate limiting (per account) and a global concurrency cap to avoid bursts that hit project-level quotas.
  - Persist tokens encrypted (`ENCRYPTION_KEY`) and refresh them proactively using refresh tokens.
- Operational recommendations:
  - Monitor API quota usage and errors (429, 5xx) and surface per-account sync errors in `Gmail health` UI.
  - For high-volume accounts, consider an adaptive sync interval (more frequent for active accounts, less frequent for idle ones).

## Analytics (aggregation)
- Scheduler includes a daily analytics job (midnight). Typical metrics to collect:
  - Daily/Monthly active users (DAU/MAU), new signups, paid conversions, new subscriptions, MRR/ARR, churn rate.
  - Background job durations and failure rates (workers), webhook success/failure rates.
  - Payment verification latency and failures.
- Storage and tooling:
  - For basic needs, store aggregates in Postgres (analytics table) and retain per-company summaries.
  - For larger scale, stream events to an analytics store (BigQuery / ClickHouse / Snowflake) via an event pipeline.
- Retention & privacy:
  - Define retention windows for detailed events (e.g., 90 days) and only keep long-term aggregates.

## Webhooks
- Delivery model:
  - Webhooks are enqueued to `webhook-delivery` and delivered by workers with retry/backoff logic.
  - Each delivery attempt should record status, response code, and time to allow later inspection and triage.
- Health & observability:
  - Endpoint `/api/dashboard/webhooks/health` exists to surface endpoint health and recent success rates.
  - Use signing (HMAC) with `WEBHOOK_SECRET_PEPPER` to allow receivers to verify authenticity.
  - Implement idempotency keys on consumer side and dedupe deliveries server-side.
  - Dead-letter queue for permanently failing deliveries; expose a retry UI for manual retries.

## API Keys & Rate Limiting
- Storage:
  - Store API keys hashed/peppered (`API_KEY_PEPPER`) and never display full raw keys after creation.
  - Provide regeneration and revocation flows in the dashboard.
- Throttling & safety:
  - Apply per-key and per-organization rate limits.
  - Log usage and provide per-key dashboards for customers.
  - Enforce strict scopes (if applicable) for keys used by products, webhooks, or integrations.
- Rotation:
  - Encourage periodic rotation; provide easy rotation UX and immediate revocation.

## Security & Secrets
- Required secrets (minimum): `DATABASE_URL`, `NEXTAUTH_SECRET`/`AUTH_SECRET`, `ENCRYPTION_KEY`, `REDIS_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`.
- Secret handling:
  - Use `ENCRYPTION_KEY` (32 bytes) for symmetric encryption of tokens. Store encrypted tokens in DB.
  - Use `API_KEY_PEPPER` and `WEBHOOK_SECRET_PEPPER` for peppered hashes.
  - Avoid placing secrets in checked-in files or logs.
- Runtime protections:
  - Enforce secure cookies, SameSite, and CSRF protections on session endpoints.
  - Validate and rate-limit endpoints that accept external data (webhooks, public APIs).
  - Use monitoring and alerting for authentication anomalies, repeated failures, and high error rates.

## Production checklist (quick)
1. Provision Postgres with enough connection capacity; set `DATABASE_URL` and `DIRECT_URL`.
2. Provision Redis and set `REDIS_URL`.
3. Configure secrets: `ENCRYPTION_KEY`, `NEXTAUTH_SECRET`, `API_KEY_PEPPER`, `RESEND_API_KEY`, `WEBHOOK_SECRET_PEPPER`.
4. Run `prisma migrate deploy` and `prisma db seed` (if needed).
5. Build app (`npm run build`) and deploy app container (Dockerfile exists).
6. Start workers (`npm run worker`) and scheduler (`npm run scheduler`) as services.
7. Test: health endpoints, webhook health, Gmail sync for a test account, checkout flow end-to-end (create PENDING and verify).
8. Configure monitoring (logs, Sentry, uptime probes) and alerting for critical failures.

## Where to look in the repo
- Plans: `lib/plans.ts` (single canonical file for plan/price definitions)
- Checkout & payment endpoints: `app/api/dashboard/billing/checkout/route.ts` and `app/api/dashboard/billing/payment/route.ts`
- Workers & Scheduler: `workers/worker.ts`, `workers/scheduler.ts`, `lib/queues.ts`
- Prisma schema: `prisma/schema.prisma` (models: `SubscriptionPayment`, `Subscription`)
- Webhook health: `app/api/dashboard/webhooks/health/route.ts`

---
If you want, I can also:
- Convert this document into a runbook with command snippets and monitoring dashboards.
- Open a Playwright E2E checklist to fully validate the onboarding → checkout → payment verification flow.
