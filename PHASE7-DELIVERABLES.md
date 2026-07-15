Phase 7 — Final audit, tests, deliverables, production readiness

Goal: Prepare the project for production deployment and handoff. Run final audits, add CI, verify workers, and document deployment/runbooks.

Checklist

- [ ] Run full typecheck and lint locally and fix any issues (`npm run typecheck`, `npm run lint`).
- [ ] Run `npm run build` and fix build-time errors.
- [ ] Create and run integration/smoke tests for API routes used in production (auth, payments, webhooks).
- [ ] Verify Prisma migrations: run `npm run prisma:migrate` in a safe environment and ensure `prisma generate` completes.
- [ ] Verify worker startup and queue connectivity (set `REDIS_URL` in staging), run `npm run worker` and confirm processors run.
- [ ] Add or finalize GitHub Actions CI (typecheck, lint, build, prisma:generate). Ensure secrets are configured for PR checks.
- [ ] Prepare release checklist: environment variables, secrets, deployment steps (Vercel/Railway), and DB migration plan.
- [ ] Add runbook for handling Redis outages and retry storms (how to disable queues, fallback behavior).
- [ ] Add monitoring and alerting hooks (Sentry/Prometheus logs/healthcheck endpoints).
- [ ] Document maintenance tasks and rollbacks.

Recommended next actions

1. I can run `npm run typecheck` and `npm run lint` locally in the workspace, fix issues, then run `npm run build` to catch build-time problems.
2. I can scaffold an `integration-tests` folder with a minimal Playwright or Jest + Supertest setup for key endpoints.
3. I can add or update the CI workflow to include Prisma steps and optional worker smoke-tests.

Which next action would you like me to take now?