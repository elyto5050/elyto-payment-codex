# Elyto Security Model

- Every business table is scoped through organization or project ownership.
- Gmail tokens are encrypted at rest with AES-256-GCM.
- API keys are hashed and only displayed once.
- Webhooks are signed using HMAC-SHA256 with timestamp replay protection.
- Audit logs capture sensitive actions.
- Public APIs use versioning, request validation, and rate limiting.
- Cloudflare Turnstile is required for production login and signup flows.
