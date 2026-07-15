# Vercel Deployment

## Setup

1. Import GitHub repository to Vercel
2. Framework preset: **Next.js**
3. Build command: `npm run build`
4. Install command: `npm install && npm run prisma:generate`

## Required Environment Variables

```
DATABASE_URL
DIRECT_URL
NEXTAUTH_URL=https://elyto.in
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
REDIS_URL
ENCRYPTION_KEY
API_KEY_PEPPER
WEBHOOK_SECRET_PEPPER
NEXT_PUBLIC_APP_URL=https://elyto.in
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
UPLOADTHING_TOKEN
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

## Google OAuth Redirects

Add to Google Cloud Console:
- `https://elyto.in/api/auth/callback/google`
- `https://elyto.in/api/dashboard/gmail/callback`

## Razorpay Webhook

Point to: `https://elyto.in/api/webhooks/razorpay`

## Domain

Configure `elyto.in` in Vercel → Settings → Domains.

Use Cloudflare for DNS + Turnstile + optional WAF.
