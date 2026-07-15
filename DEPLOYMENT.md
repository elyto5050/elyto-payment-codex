# Elyto Deployment

Elyto is deployed as three independent services:

- Web: Next.js on Vercel.
- Worker: Railway background worker running `npm run worker`.
- Scheduler: Railway background worker running `npm run scheduler`.

No VPS is required.

## Required services

- PostgreSQL: Neon.
- Redis: Upstash Redis compatible with BullMQ.
- Web hosting: Vercel.
- Background processes: Railway.
- DNS/proxy: Cloudflare.

## Required environment variables

Set these on Vercel and on both Railway services unless noted otherwise:

- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET` or `AUTH_SECRET`
- `WEBHOOK_SECRET` or `WEBHOOK_SECRET_PEPPER`
- `ENCRYPTION_KEY`
- `API_KEY_PEPPER`
- `NEXT_PUBLIC_APP_URL`

Worker-only optional tuning:

- `WORKER_PORT`
- `PAYMENT_WORKER_CONCURRENCY`
- `GMAIL_WORKER_CONCURRENCY`
- `WEBHOOK_WORKER_CONCURRENCY`
- `ANALYTICS_WORKER_CONCURRENCY`
- `BILLING_WORKER_CONCURRENCY`
- `ACCOUNT_WORKER_CONCURRENCY`

Scheduler-only optional tuning:

- `SCHEDULER_PORT`
- `GMAIL_SYNC_CRON`
- `ANALYTICS_CRON`
- `BILLING_RESET_CRON`

## Vercel web deployment

Build command:

```bash
npm run prisma:generate && npm run build
```

Start command:

```bash
npm start
```

Run migrations separately before promoting a release:

```bash
npm run prisma:deploy
```

## Railway worker service

Create a Railway service from this repository.

Start command:

```bash
npm run worker
```

Health check path:

```text
/health
```

The worker consumes queues only. It does not create repeatable scheduled jobs.

## Railway scheduler service

Create a second Railway service from the same repository.

Start command:

```bash
npm run scheduler
```

Health check path:

```text
/health
```

The scheduler registers repeatable BullMQ jobs only. It does not consume queues.

## Docker

Build:

```bash
docker build -t elyto .
```

Run web:

```bash
docker run --env-file .env -p 3000:3000 elyto
```

Run worker:

```bash
docker run --env-file .env -p 3001:3001 elyto npm run worker
```

Run scheduler:

```bash
docker run --env-file .env -p 3002:3002 elyto npm run scheduler
```

`docker-compose.yml` defines the same three services and expects database/Redis URLs from `.env`.

## Recovery

- Worker crash: Railway restarts the worker. Scheduler continues registering repeatable jobs independently.
- Scheduler crash: existing repeatable jobs remain in Redis. Worker continues consuming queued jobs.
- Redis outage: `/health` returns unhealthy. Restart after Redis recovers.
- Database outage: `/health` returns unhealthy. Jobs retry with exponential backoff.
- Permanent job failure: inspect the relevant dead-letter queue (`payment-failed`, `gmail-failed`, `webhook-failed`, etc.).
