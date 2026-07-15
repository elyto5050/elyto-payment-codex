Elyto Deployment & Runbook

Overview

This document describes steps to prepare, deploy, and maintain Elyto in production. It focuses on DB migrations, workers, Redis resilience, secrets, and rollback steps.

Prerequisites

- A PostgreSQL database (connection string in `DATABASE_URL`)
- Redis instance (connection string in `REDIS_URL`) for BullMQ workers
- Environment variables configured for NextAuth, Resend, UploadThing, Gmail OAuth, etc.
- CI runner with Node 20+ and `pnpm`/`npm` installed

Quick deploy (staging)

1. Create a backup of production DB before running migrations.
2. Set environment variables in your deployment platform (Vercel/Railway/Heroku).
3. In CI or on the target machine, run:

```bash
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run build
npm start
```

Database migrations

- Use `prisma migrate dev --name description` in local dev to scaffold migration SQL.
- Do NOT run `prisma migrate dev` directly in production; use `prisma migrate deploy`.
- Always back up DB prior to migrations.

Workers & Redis

- Workers require `REDIS_URL`. Start workers with `npm run worker` or use a process manager.
- To avoid retry storms when Redis is unreachable, consider gating queue creation and using an in-memory fallback or toggling worker start via env (`REDIS_URL` empty disables workers).
- Alerting: configure monitoring for repeated `ECONNREFUSED` and set throttling on job retries.

Rollback

- If a migration needs rollback: restore DB from pre-migration backup, revert code, and re-deploy.

Secrets

- Store `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `REDIS_URL`, `DATABASE_URL` securely in your platform's secrets store.

Healthchecks & Monitoring

- Add a `/api/health` route that verifies DB and Redis connections.
- Integrate Sentry or another APM for error tracking.

Contact

- For operational issues, check worker logs and Redis metrics, then follow the rollback plan above.
