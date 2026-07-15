# Elyto — Roadmap

Aligned with the **authoritative verification engine specification**. Elyto verifies UPI payments via Gmail/FamPay — it does not process money.

---

## Completed

### Phase 1 — Core Verification Platform

- [x] Multi-tenant schema (Organization, Project, Order, Transaction)
- [x] NextAuth (Google + magic link) with org bootstrap
- [x] Dashboard: projects, products, orders, Gmail, API keys, webhooks
- [x] Developer API v1: orders, transactions, projects
- [x] Public checkout `/pay/{orderId}` with UPI QR + UTR submission
- [x] Gmail OAuth with encrypted token storage
- [x] Gmail sync worker + BullMQ verification queue
- [x] Webhook delivery with HMAC signing
- [x] Redis rate limiting (memory fallback)
- [x] Audit + activity logs

### Phase 2 — Platform SaaS

- [x] Marketing site (home, features, pricing, docs, legal)
- [x] Admin panel (users, projects, legal editor, tickets)
- [x] Team invites + RBAC
- [x] Analytics dashboard (Recharts)
- [x] Branded React Email templates
- [x] Turnstile on auth
- [x] CI via GitHub Actions

### Phase 3 — Operations & Security

- [x] Usage limits via Subscription model (no payment gateway)
- [x] UploadThing project logos
- [x] Notifications UI
- [x] Security page + MFA scaffold
- [x] Webhook test + health endpoints
- [x] Scheduled Gmail sync (10 min) + daily analytics

### Phase 4 — Content & Docs

- [x] Blog CMS
- [x] Architecture + deployment guides (`docs/`)
- [x] Sentry-ready monitoring hooks
- [x] Webhook verification code examples (Node, Python, PHP)
- [x] Memory backup docs (PROJECT_CONTEXT, DATABASE_SCHEMA, API_REFERENCE, ROADMAP)

### Spec Alignment (Current Sprint)

- [x] `VerifiedTransaction` table for permanent UTR records
- [x] Order statuses: `UTR_SUBMITTED`, `VERIFIED` (+ legacy compat)
- [x] FamPay-focused email parser
- [x] 30-minute payment time window from order creation
- [x] Spec failure reason codes on orders and webhooks
- [x] `order.verified` webhook payload per spec
- [x] Remove Razorpay / payment processing integration
- [x] Order fields: `failureReason`, `matchedEmailId`, `matchedUtr`, `verificationSource`

---

## In Progress / Next Up

### Verification Engine Hardening

- [ ] Verification attempt rate limits per order (prevent brute-force UTR guessing)
- [ ] Store full verification history table (attempt log separate from audit)
- [ ] Polling on checkout page until VERIFIED/FAILED (currently static after submit)
- [ ] Explicit payment-success check in Transaction cache before matching

### Gmail / Parsing

- [ ] FamPay sender allowlist (from: addresses) for stricter filtering
- [ ] Handle HTML-only FamPay emails (currently prefers text/plain)
- [ ] Incremental Gmail sync via historyId (currently full recent scan)
- [ ] Parser unit tests with real FamPay email fixtures

### Developer Experience

- [ ] OpenAPI / Swagger spec generation from routes
- [ ] SDK packages (Node, Python)
- [ ] Sandbox/test mode with mock verification
- [ ] Webhook event replay from dashboard

### Dashboard Polish

- [ ] Order detail view with verification timeline
- [ ] Manual re-verify button for failed orders
- [ ] Gmail connection health indicators
- [ ] Export orders/transactions CSV

---

## Explicitly Out of Scope (Do Not Build)

Per authoritative spec — **never implement**:

- Payment gateways (Razorpay, Stripe, etc.)
- Payment capture, holding, routing, settlement
- Payout systems
- Payment aggregators
- Non-Gmail payment sources (until spec expands)
- Product delivery (Discord roles, game whitelists — merchant responsibility)

---

## Future (Post-MVP, Spec TBD)

These require explicit product decision before implementation:

- Additional email sources (Paytm, PhonePe, bank alerts)
- SMS / bank statement verification
- Multi-currency beyond INR display
- White-label checkout domains
- Enterprise SSO (SAML)
- Self-hosted deployment package

---

## Deployment Checklist

Before production:

1. Apply all Prisma migrations (`npm run prisma:deploy`)
2. Set all env vars (see `.env.example`)
3. Run Redis + workers on Railway/similar
4. Configure Google OAuth with Gmail scopes for production domain
5. Set up Resend for transactional email
6. Enable Turnstile on auth endpoints
7. Configure webhook URLs on merchant projects
8. Test end-to-end: order → UPI pay → UTR → Gmail sync → verified webhook

See `docs/deployment.md`, `docs/vercel.md`, `docs/railway.md`.

---

## Technical Debt

- Legacy `OrderStatus` values `VERIFYING` and `PAID` in enum — migrate existing rows, remove from new code paths
- `Subscription.razorpaySubId` fields in schema — remove in future migration
- Some dashboard pages reference "paid" terminology — align UI copy to "verified"
- MFA scaffold exists but not enforced at login

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Verification latency (UTR submit → VERIFIED) | < 60 seconds with active Gmail sync |
| Webhook delivery success rate | > 99% |
| False positive rate | 0% (strict UTR + amount + time match) |
| UTR reuse attempts blocked | 100% via VerifiedTransaction |
