# Elyto System Architecture

## Overview

Elyto is a multi-tenant SaaS platform for UPI payment verification and order fulfillment automation. It is not a payment gateway — it verifies payments via Gmail transaction emails and triggers webhooks.

```
Customer → Checkout (/pay/:id) → UTR Submit → Verification Worker
                                                      ↓
Gmail Sync Worker → Parse Transaction → Match UTR/Amount → order.paid Webhook
```

## Multi-Tenancy

- **Organization** is the tenant boundary
- **TeamMember** provides RBAC (Owner, Admin, Manager, Viewer)
- All queries scoped by `organizationId` or `project.organizationId`
- API keys hashed with pepper, never stored plaintext

## Core Services

| Service | Location | Purpose |
|---------|----------|---------|
| Verification Engine | `lib/services/verification.ts` | UTR, amount, time, duplicate checks |
| Gmail Sync | `lib/gmail/sync.ts` | Poll inbox, parse payment emails |
| Webhook Delivery | `lib/services/webhooks.ts` | HMAC-signed HTTP delivery with retries |
| Billing | `lib/services/billing.ts` | Razorpay plans, usage limits |
| Analytics | `lib/services/analytics.ts` | Daily metrics aggregation |

## Queue Architecture (BullMQ + Redis)

| Queue | Worker | Schedule |
|-------|--------|----------|
| `payment-verification` | Verify UTR against transactions | On UTR submit |
| `gmail-sync` | Sync single/all Gmail connections | Every 10 min |
| `webhook-delivery` | HTTP POST to endpoints | On events |
| `analytics` | Aggregate daily metrics | Daily midnight |

Run: `npm run worker` + `npm run scheduler`

## API Architecture

- **Dashboard API**: `/api/dashboard/*` — session auth
- **Public API v1**: `/api/v1/*` — Bearer secret key
- **Admin API**: `/api/admin/*` — platform role check
- 

## Security Model

- AES-256-GCM token encryption
- HMAC-SHA256 webhook signatures with 5-min replay window
- Redis rate limiting (memory fallback)
- Cloudflare Turnstile on auth
- Audit logs + activity logs on sensitive actions
- MFA scaffold (TOTP) on Security page

## Database

PostgreSQL via Prisma. Key models: User, Organization, Project, Order, Transaction, GmailConnection, WebhookEndpoint, Subscription, BlogPost, PlatformContent.

## Deployment

- **Vercel**: Next.js app + API routes
- **Railway**: PostgreSQL, Redis, worker + scheduler processes
