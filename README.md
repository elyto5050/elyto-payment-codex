# Elyto

Elyto is a production-oriented SaaS platform for UPI payment verification and order fulfillment automation.

## Stack

- Next.js 15 App Router
- React 19 + TanStack Query
- TypeScript + Prisma + PostgreSQL
- NextAuth (Google OAuth + Magic Link)
- BullMQ + Redis
- Resend + React Email
- Tailwind CSS

## Quick start

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, etc.
npm run prisma:generate
npm run prisma:migratenpm 
```

Run background workers separately:

```bash
npm run worker
```

## Phase 3 & 4 features

- Verification usage limits (Subscription model — no payment processing)
- UploadThing project logo uploads
- Notifications dashboard + in-app alerts on verification
- Security page: login history, MFA (TOTP), security events
- Webhook test button + health monitoring
- Scheduled Gmail sync (10min) + daily analytics aggregation
- Blog CMS in admin panel with dynamic `/blog/[slug]` pages
- Complete architecture + Vercel/Railway deployment guides
- Sentry-ready error monitoring hooks
- Webhook verification examples: Node, Python, PHP

## Phase 2 features

- Full marketing site (Features, About, Contact, Blog, Docs, API Docs, Privacy, Terms, Refund, Security, Status)
- Framer Motion homepage with 3D animated blocks
- Admin panel at `/admin` (users, projects, legal editor, tickets)
- Team invites with email + role-based access
- Analytics dashboard with Recharts
- Branded email templates with logo
- Turnstile on login/signup (when configured)
- Support tickets + contact form
- Billing page shell
- CI/CD via GitHub Actions

## Phase 1 features

- Auth middleware + org bootstrap on signup
- Dashboard: projects, products, orders, Gmail, API keys, webhooks, activity
- Developer API: `/api/v1/projects`, `/api/v1/orders`, `/api/v1/transactions`
- Public checkout at `/pay/[orderId]` with UPI QR + UTR submission
- Gmail OAuth connect + sync worker
- Webhook delivery with HMAC signing
- Redis-backed rate limiting (falls back to memory)

## Deployment

See [docs/deployment.md](docs/deployment.md).

## Admin subdomain (admin.elyto.in)

This project can serve the admin panel from a dedicated subdomain (for example: `admin.elyto.in`). Below are recommended steps for production and local development.

1. DNS & hosting
- Create an A record (or CNAME) for `admin.elyto.in` pointing to your host or platform.
- On platforms like Vercel, add `admin.elyto.in` to the Project → Domains and enable HTTPS.

2. Environment variables
- `DATABASE_URL` — production DB connection (shared or separate per your choice).
- `NEXTAUTH_URL=https://admin.elyto.in` (important for OAuth redirects and session cookies).
- `NEXT_PUBLIC_APP_URL=https://elyto.in` (or your public site URL).
- `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, `REDIS_URL`, etc. — ensure production values are set.

3. Host-based routing (recommended)
Use a middleware to rewrite requests coming to the admin subdomain into the admin app path. Create a `middleware.ts` at the project root with the example below:

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
	const host = req.headers.get("host") || "";
	const url = req.nextUrl.clone();

	// If request is for the admin subdomain, rewrite to /admin
	if (host.startsWith("admin.")) {
		// avoid rewriting API/_next/_static assets
		if (!url.pathname.startsWith("/api") && !url.pathname.startsWith("/_next")) {
			url.pathname = `/admin${url.pathname}`;
			return NextResponse.rewrite(url);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/|api/).*)", "/"],
};
```

This preserves your existing `app/(admin)/admin` pages and serves them at the root of the admin subdomain.

4. OAuth redirect URIs
- In Google Cloud Console (or other provider), add:
	- `https://admin.elyto.in/api/auth/callback/google`
	- Also keep `https://elyto.in/api/auth/callback/google` if your main site uses it.

5. Optional: share session cookies across subdomains
- To share auth sessions between `elyto.in` and `admin.elyto.in`, set the cookie domain to `.elyto.in` in your NextAuth config (in `lib/auth.ts`). Example:

```ts
cookies: {
	sessionToken: {
		name: 'next-auth.session-token',
		options: {
			httpOnly: true,
			sameSite: 'lax',
			path: '/',
			domain: '.elyto.in',
			secure: process.env.NODE_ENV === 'production'
		}
	}
}
```

Note: Changing cookie domain will affect existing sessions — test carefully.

6. Granting admin access
- Use Prisma Studio: `npx prisma studio` and set `platformRole = ADMIN` on a user.
- Or run a quick script to set a user to admin:

```bash
npx tsx -e "import {PrismaClient} from'@prisma/client';const p=new PrismaClient();await p.user.update({where:{email:'you@example.com'},data:{platformRole:'ADMIN'}});console.log('done');await p.$disconnect();"
```

7. Local development testing
- Add to your hosts file (requires admin privileges):

```
127.0.0.1 admin.elyto.in
```

- Start dev server with `NEXTAUTH_URL` set to the admin host. Example (PowerShell):

```powershell
$env:NEXTAUTH_URL='http://admin.elyto.in:3000'; npm run dev
```

8. Verify
- Visit `http://admin.elyto.in:3000` (dev) or `https://admin.elyto.in` (prod).
- Sign in and ensure the user has `platformRole = ADMIN` (see `lib/api/admin.ts` for guards).

9. Security recommendations
- Require TLS (HTTPS) for the admin subdomain; enable HSTS.
- Consider IP allowlisting or basic auth during early rollout.
- Ensure admin APIs are guarded with `requirePlatformAdmin()` (already in `lib/api/admin.ts`).

If you'd like, I can add the `middleware.ts` file and optionally apply the cookie-domain change behind a feature flag for local testing.


