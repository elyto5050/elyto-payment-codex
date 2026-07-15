# Elyto — Project Context

> **Authoritative product spec:** Elyto is a **payment verification platform**. It does **not** hold, capture, process, route, or settle money. It only determines whether a UPI payment has successfully occurred by matching customer-submitted UTRs against Gmail transaction confirmation emails (FamPay MVP).

This document captures the current codebase state so future AI sessions can continue development without losing context.

---

## What Elyto Does

1. Merchant creates an order via API or dashboard.
2. Customer pays the merchant directly via UPI (money never touches Elyto).
3. Customer submits UTR on the hosted checkout page (`/pay/{orderId}`).
4. Elyto syncs Gmail, parses FamPay confirmation emails, and matches UTR + amount + timestamp.
5. On success, order becomes `VERIFIED` and a signed `order.verified` webhook is delivered.
6. Merchant fulfills the product (Discord role, SaaS access, etc.) — Elyto never delivers products.

---

## MVP Scope (Current)

| Supported | Not in MVP |
|-----------|------------|
| Gmail OAuth (encrypted tokens) | Payment gateways / aggregators |
| FamPay transaction email parsing | Razorpay / payment capture |
| UPI + UTR verification | Settlement / payout systems |
| Order verification | Other email providers (future) |
| HMAC-signed webhooks | |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 App Router, React 19, TypeScript |
| Database | PostgreSQL via Prisma 6 |
| Auth | NextAuth v5 (Google OAuth + Resend magic link) |
| Queue | BullMQ + Redis (verification, Gmail sync, webhooks, analytics) |
| Email | Resend + React Email templates |
| UI | Tailwind CSS, TanStack Query, Recharts, Framer Motion |
| Security | AES encryption for tokens, HMAC webhooks, rate limiting, Turnstile |

---

## Repository Layout

```
app/
  (marketing)/          Public marketing site (home, pricing, docs, legal)
  (dashboard)/dashboard/ Merchant dashboard (projects, orders, Gmail, webhooks, etc.)
  (auth)/               Login / signup
  admin/                Platform admin panel
  pay/[orderId]/        Public checkout (UPI QR + UTR submission)
  api/
    v1/                 Developer API (orders, transactions, projects, analytics)
    dashboard/          Authenticated dashboard APIs
    pay/                Public checkout UTR submission
    auth/               NextAuth + Turnstile
    admin/              Admin CMS APIs
    contact/            Contact form

lib/
  services/             Business logic (orders, verification, webhooks, audit, analytics)
  gmail/                OAuth, sync worker, FamPay email parser
  security/             Crypto, rate limiting, webhook signing, API keys
  api/                  Response helpers, middleware
  email/                Resend send helpers
  queues.ts             BullMQ queue definitions

workers/
  worker.ts             payment-verification, gmail-sync, webhook-delivery, analytics
  scheduler.ts          Scheduled Gmail sync (10 min), daily metrics

prisma/
  schema.prisma         Database schema
  migrations/           SQL migrations

emails/                 React Email templates
docs/                   Architecture and deployment guides
components/             Shared UI + checkout form
```

---

## Core Flows

### Order Creation

```
POST /api/v1/orders  (Bearer secret API key)
  → createOrder() in lib/services/orders.ts
  → Returns: orderId (publicId), checkoutUrl, status PENDING
  → Order expires after 30 minutes (expiresAt)
  → Webhook event: order.created
```

### Customer Payment + UTR

```
GET /pay/{orderId}           Hosted checkout with dynamic UPI QR
POST /api/pay/{orderId}/verify   Customer submits UTR
  → submitOrderUtr() → status UTR_SUBMITTED
  → BullMQ job: payment-verification
```

### Gmail Connection

```
Dashboard → Connect Gmail → OAuth callback
  → Tokens stored encrypted (accessTokenEncrypted, refreshTokenEncrypted)
  → Worker syncs FamPay emails every 10 minutes (scheduler)
```

### Verification Engine

```
lib/services/verification.ts → verifyOrderByUtr()

1. Check order exists + UTR submitted
2. Check order not expired
3. Check VerifiedTransaction — reject UTR_ALREADY_USED if UTR already verified
4. Find parsed Transaction cache entry by projectId + UTR
5. If not found → EMAIL_NOT_FOUND (retry via queue)
6. Validate amount, payment success, 30-minute time window from order.createdAt
7. On success:
   - Create VerifiedTransaction (permanent UTR record)
   - Order → VERIFIED, store matchedEmailId, matchedUtr, verificationSource
   - Webhook → order.verified
8. On failure:
   - Order → FAILED, store failureReason
   - Webhook → order.failed
```

### Webhook Delivery

```
lib/services/webhooks.ts → deliverWebhookEvent()
  → HMAC-SHA256 signed payload
  → Headers: Elyto-Signature, Elyto-Timestamp, Elyto-Event
  → Retries via BullMQ (5 attempts, exponential backoff)
```

---

## Environment Variables

See `.env.example`. Critical vars:

- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — Auth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Login + Gmail OAuth
- `ENCRYPTION_KEY` — AES for Gmail tokens and secrets
- `REDIS_URL` — BullMQ + rate limiting
- `RESEND_API_KEY` — Transactional email
- `NEXT_PUBLIC_APP_URL` — Checkout URLs and callbacks

---

## Workers

Run separately from Next.js:

```bash
npm run worker      # Processes verification, Gmail sync, webhooks
npm run scheduler   # Cron-style scheduled jobs
```

Without `REDIS_URL`, queues are disabled; UTR submission still works but verification must be triggered manually or synchronously.

---

## Security Requirements (Implemented)

- Audit logs (`AuditLog`, `ActivityLog`)
- HMAC-signed webhooks
- Encrypted Gmail OAuth tokens
- Rate limiting (Redis with in-memory fallback)
- Turnstile on auth (when configured)
- Duplicate UTR prevention via `VerifiedTransaction`
- Verification failure logging

---

## Known Legacy / Non-Spec Items

The codebase includes platform SaaS features beyond the core verification engine:

- Marketing site, admin panel, blog CMS, team invites, analytics dashboard
- `Subscription` model for verification usage limits (no payment processing)
- Legacy order statuses `VERIFYING` and `PAID` remain in enum for DB compatibility; new code uses `UTR_SUBMITTED` and `VERIFIED`

**Do not add:** Razorpay, payment gateways, money capture, settlement, or payout systems.

---

## Key Files

| Purpose | Path |
|---------|------|
| Prisma schema | `prisma/schema.prisma` |
| Order service | `lib/services/orders.ts` |
| Verification engine | `lib/services/verification.ts` |
| FamPay parser | `lib/gmail/parser.ts` |
| Gmail sync | `lib/gmail/sync.ts` |
| Webhook delivery | `lib/services/webhooks.ts` |
| Auth config | `lib/auth.ts` |
| Middleware | `middleware.ts` |
| Checkout page | `app/pay/[orderId]/page.tsx` |
| Developer API orders | `app/api/v1/orders/route.ts` |

---

## Commands

```bash
npm install
npm run prisma:generate
npm run prisma:migrate    # or prisma:deploy for production
npm run dev
npm run build
npm run typecheck
npm run worker
npm run scheduler
```
