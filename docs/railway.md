# Railway Deployment

## Services to Create

1. **PostgreSQL** — primary database
2. **Redis** — BullMQ queues + rate limiting
3. **Web** (optional) — if not using Vercel for the app
4. **Worker** — background job processor
5. **Scheduler** — repeatable cron jobs

## Worker Service

```bash
# Start command
npm run worker

# Environment
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
ENCRYPTION_KEY=...
API_KEY_PEPPER=...
```

## Scheduler Service

```bash
npm run scheduler
```

Same env vars as worker.

## PostgreSQL

Copy `DATABASE_URL` and `DIRECT_URL` to Vercel environment variables.

Run migrations after deploy:

```bash
npm run prisma:deploy
npm run prisma:seed
```

## Redis

Set `REDIS_URL` in both Vercel and Railway worker/scheduler services.
