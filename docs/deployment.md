# Elyto Production Deployment Guide

## Architecture

```
                    ┌─────────────┐
                    │  Cloudflare  │ DNS, Turnstile, WAF
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │         Vercel          │
              │   Next.js 15 + API      │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐
   │ Railway   │    │  Railway    │   │  Railway    │
   │ PostgreSQL│    │   Redis     │   │ Worker +    │
   │           │    │             │   │ Scheduler   │
   └───────────┘    └─────────────┘   └─────────────┘
```

See also: [architecture.md](./architecture.md), [vercel.md](./vercel.md), [railway.md](./railway.md)

## Pre-Launch Checklist

- [ ] PostgreSQL provisioned (Railway/Neon)
- [ ] Redis provisioned (Railway/Upstash)
- [ ] `npm run prisma:deploy` run against production DB
- [ ] `npm run prisma:seed` for legal pages
- [ ] `SEED_ADMIN_EMAIL` set for platform admin
- [ ] Google OAuth configured (login + Gmail scopes)
- [ ] Resend domain verified
- [ ] Razorpay live keys + webhook configured
- [ ] UploadThing app created
- [ ] Turnstile enabled on login/signup
- [ ] Worker + scheduler running on Railway
- [ ] All env vars set on Vercel
- [ ] Custom domain `elyto.in` configured

## Services

| Service | Provider | Purpose |
|---------|----------|---------|
| Web App | Vercel | Next.js, API routes |
| Database | Railway/Neon | PostgreSQL |
| Queue | Railway/Upstash | Redis + BullMQ |
| Workers | Railway | Gmail sync, verification, webhooks |
| Email | Resend | Transactional email |
| Billing | Razorpay | Subscription payments |
| Files | UploadThing | Project logos |
| Bot protection | Cloudflare | Turnstile |

## CI/CD

GitHub Actions runs on every push to `main`:
- Typecheck
- Lint
- Build

See `.github/workflows/ci.yml`

## Monitoring

Set `SENTRY_DSN` to enable error monitoring. Hooks are in `lib/monitoring.ts`.

## Security

See [security.md](./security.md)
