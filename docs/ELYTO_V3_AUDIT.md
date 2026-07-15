# Elyto V3 Audit

Date: 2026-06-12

## Architecture

- Next.js 15 App Router application with route groups for marketing, dashboard, and admin surfaces.
- Prisma/PostgreSQL data layer in `prisma/schema.prisma`, with service modules under `lib/services`.
- NextAuth/Auth.js v5 beta is used for Google OAuth and Resend magic-link login.
- React Query powers client dashboard fetching.
- React Email/Resend handles transactional email templates.
- BullMQ queues are present for webhook delivery workers and schedulers.

## Existing Features

- Marketing pages: home, features, pricing, docs, API docs, status, blog, contact, legal pages.
- Auth: login, signup, magic link, Google OAuth, provider availability endpoint.
- Tenant dashboard: overview, projects, products, orders, Gmail, API keys, webhooks, analytics, team, notifications, billing, support, security, activity, settings.
- Public checkout and payment verification pages.
- API key authenticated v1 API for projects, orders, transactions, and analytics.
- Gmail OAuth connection and sync primitives.
- Webhook endpoints, events, delivery logs, retries, and test delivery.
- Notifications, support tickets, login history, security events, audit/activity logs.
- Basic subscription usage limits for verification quota.

## Existing Dashboards

- `/dashboard`: tenant overview with stats, onboarding, recent orders, activity feed, Gmail status, and webhook health.
- `/dashboard/projects`: project list and creation.
- `/dashboard/products`: product management.
- `/dashboard/orders`: order list and detail pages.
- `/dashboard/analytics`: revenue/order/verification analytics using Recharts.
- `/dashboard/gmail`: Gmail connection center.
- `/dashboard/webhooks`: endpoint management and health checks.
- `/dashboard/api-keys`: API key management.
- `/dashboard/team`: team invite and member management.
- `/dashboard/security`: MFA, login/security events.
- `/dashboard/billing`: subscription/usage overview.
- `/dashboard/notifications`, `/dashboard/support`, `/dashboard/activity`, `/dashboard/settings`.
- `/admin`: existing platform admin area with overview, users, projects, legal pages, blog, and tickets.

## Existing Roles And Permissions

- `PlatformRole`: `USER`, `ADMIN`, `SUPPORT`.
- `TeamRole`: `OWNER`, `ADMIN`, `MANAGER`, `VIEWER`.
- Organization access is membership-based through `TeamMember`.
- Permission checks are rank-based in `lib/permissions.ts`.
- Current permissions are hardcoded by role rank, not database-driven.

## Existing Owner/Admin Systems

- Organization owner is stored as `Organization.ownerId`.
- Team owner role exists at organization level.
- Platform admin access is allowed for `ADMIN` and `SUPPORT` in `lib/api/admin.ts` and `/admin` layout.
- No dedicated platform owner role exists.
- No immutable primary owner protection exists.
- No ownership transfer flow exists at `/transferowner`.

## Existing Security Systems

- Auth.js JWT sessions with Prisma adapter.
- Middleware protects `/dashboard` and `/admin` routes.
- API keys are hashed with pepper before storage.
- Webhook secrets are hashed and webhook signatures are generated.
- Gmail access/refresh tokens are encrypted.
- MFA service exists with TOTP secret encryption.
- Login history and security events are modeled.
- Tenant checks enforce organization membership before privileged dashboard APIs.
- Rate limit and Turnstile helpers exist.

## Billing And Verification Flows

- Subscriptions support `STARTER`, `GROWTH`, and `SCALE` plans.
- Verification quota is tracked through `Subscription.verificationsUsed` and `verificationLimit`.
- Verification matches submitted UTR against parsed Gmail transactions by project, amount, uniqueness, and time window.
- Successful and failed verification creates audit logs, notifications, customer emails, and webhook events.

## APIs

- Tenant dashboard APIs exist for stats, analytics, projects, products, orders, Gmail, webhooks, API keys, team, support, billing, notifications, security, profile, and account deactivation/deletion.
- Public/customer APIs exist under `/api/pay`.
- External API-key APIs exist under `/api/v1`.
- Admin APIs exist for legal content and blog management.

## Existing Bugs Found

- Products page assumed `/api/dashboard/products` returned an array at `response.data`; the API actually returned `{ data: { data: products, meta } }`, causing `out.slice is not a function`.
- `tsconfig.json` used incremental TypeScript state that referenced stale `.next/types` files, causing `npm run typecheck` to fail even when source types were valid.
- App logo used `/logo.svg` while email components partially referenced a missing `public/logo.png`.
- Auth and middleware currently log sensitive operational details noisily in production paths.
- Gmail OAuth state is base64-encoded JSON without signing or expiry.
- Admin overview performs database reads during static generation and logs connection errors when the database is unreachable at build time.
- Build logs contain Recharts SSR warnings for charts with negative container dimensions.

## Technical Debt

- RBAC is hardcoded and role-rank based; requested 50+ granular permissions require new schema tables and migration.
- Platform owner is not distinct from platform admin/support.
- Admin/owner destructive actions need audit-backed workflows and stronger authorization boundaries.
- Several pages are client-only and duplicate filtering/sorting already available in APIs.
- Email system has two layout families, which increases branding drift.
- `next lint` is deprecated in Next.js 15 and should be migrated to ESLint CLI before Next.js 16.
- Some text appears mojibake-corrupted in UI/email strings.

## First Safe Implementation Slice

- Replaced app logo usage with the supplied PNG asset via `public/logo.png`.
- Replaced favicon/apple icon metadata with `/logo.png`.
- Updated both email layout systems to use the supplied hosted logo URL by default: `https://i.ibb.co/RpVR1WTg/logo.png`.
- Fixed the products page response normalization so array methods only run on arrays.
- Disabled stale incremental TypeScript state in `tsconfig.json` to restore deterministic typecheck behavior.

## Verification

- `npm.cmd run lint`: passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed.

Build still logs database connectivity errors during static generation for admin data and network/access warnings after route output, but the build exits successfully.
