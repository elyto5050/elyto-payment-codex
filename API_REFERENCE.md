# Elyto — API Reference

Base URL: `{NEXT_PUBLIC_APP_URL}` (e.g. `https://elyto.in`)

All JSON APIs return:

```json
{
  "success": true,
  "data": { ... }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "error_code",
    "message": "Human-readable message"
  }
}
```

---

## Authentication

### Developer API (`/api/v1/*`)

```
Authorization: Bearer elyto_sk_live_...
```

Secret API keys are created in the dashboard. Keys are hashed at rest; the full key is shown once on creation.

Rate limits apply per IP and endpoint (Redis-backed).

### Dashboard API (`/api/dashboard/*`)

Session cookie from NextAuth. Requires authenticated user with organization membership.

### Public Checkout (`/api/pay/*`)

No auth. Rate limited by IP.

---

## Developer API v1

### Orders

#### Create Order

```
POST /api/v1/orders
Authorization: Bearer {secret_key}
Content-Type: application/json
```

**Request:**

```json
{
  "projectId": "clx...",
  "amount": 499,
  "currency": "INR",
  "customerEmail": "user@example.com",
  "customerName": "Optional Name",
  "productId": "optional_product_id"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "ord_abc123...",
    "status": "PENDING",
    "checkoutUrl": "https://elyto.in/pay/ord_abc123..."
  }
}
```

**Errors:** `unauthorized`, `invalid_request`, `project_not_found`, `rate_limited`

---

#### Get Order

```
GET /api/v1/orders/{orderId}
```

No auth required (public order lookup by publicId).

**Response:**

```json
{
  "success": true,
  "data": {
    "publicId": "ord_...",
    "amount": "499.00",
    "currency": "INR",
    "status": "VERIFIED",
    "submittedUtr": "123456789012",
    "createdAt": "2025-06-10T10:00:00.000Z",
    "verifiedAt": "2025-06-10T10:05:00.000Z"
  }
}
```

---

#### Submit UTR (API)

```
POST /api/v1/orders/{orderId}/verify
Authorization: Bearer {secret_key}
Content-Type: application/json
```

**Request:**

```json
{
  "utr": "123456789012"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ord_...",
    "status": "UTR_SUBMITTED"
  }
}
```

Queues async verification via BullMQ.

---

### Transactions

#### List Parsed Transactions

```
GET /api/v1/transactions
Authorization: Bearer {secret_key}
```

Returns up to 50 most recent parsed Gmail transactions for the organization.

---

### Projects

#### List Projects

```
GET /api/v1/projects
Authorization: Bearer {secret_key}
```

---

### Analytics

#### Organization Analytics

```
GET /api/v1/analytics?days=30
Authorization: Bearer {secret_key}
```

Returns revenue, order counts, verification rate, daily breakdown.

---

## Public Checkout API

#### Submit UTR (Customer)

```
POST /api/pay/{orderId}/verify
Content-Type: application/json
```

**Request:**

```json
{
  "utr": "123456789012"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ord_...",
    "status": "UTR_SUBMITTED"
  }
}
```

Rate limit: 30 requests/minute per IP.

---

## Webhooks (Outbound — Elyto → Merchant)

Elyto delivers webhooks to URLs configured per project in the dashboard.

### Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `Elyto-Signature` | HMAC-SHA256 hex signature |
| `Elyto-Timestamp` | Unix timestamp used in signature |
| `Elyto-Event` | Event type string |

### Signature Verification

```
payload = timestamp + "." + raw_json_body
signature = HMAC-SHA256(webhook_secret, payload)
```

Compare `Elyto-Signature` header to computed signature. Reject if timestamp is older than 5 minutes.

### Events

#### order.created

```json
{
  "event": "order.created",
  "orderId": "ord_...",
  "amount": "499.00",
  "currency": "INR",
  "status": "PENDING"
}
```

#### order.verified

```json
{
  "event": "order.verified",
  "orderId": "ord_...",
  "amount": 499,
  "utr": "123456789012",
  "status": "verified",
  "verifiedAt": "2025-06-10T10:05:00.000Z"
}
```

#### order.failed

```json
{
  "event": "order.failed",
  "orderId": "ord_...",
  "reason": "UTR_ALREADY_USED",
  "utr": "123456789012"
}
```

#### order.utr_submitted

```json
{
  "event": "order.utr_submitted",
  "orderId": "ord_...",
  "utr": "123456789012",
  "status": "UTR_SUBMITTED"
}
```

Retries: up to 5 attempts with exponential backoff.

---

## Dashboard API (Selected Endpoints)

All require session auth unless noted.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Dashboard summary stats |
| GET/POST | `/api/dashboard/projects` | List/create projects |
| GET/PATCH/DELETE | `/api/dashboard/projects/[id]` | Project CRUD |
| POST | `/api/dashboard/projects/[id]/regenerate-keys` | Regenerate API keys |
| GET/POST | `/api/dashboard/products` | Product catalog |
| GET/PATCH/DELETE | `/api/dashboard/products/[id]` | Product CRUD |
| GET | `/api/dashboard/orders` | List orders |
| GET/POST | `/api/dashboard/api-keys` | API key management |
| GET/POST | `/api/dashboard/webhooks` | Webhook endpoints |
| POST | `/api/dashboard/webhooks/[id]/test` | Send test webhook |
| GET | `/api/dashboard/webhooks/health` | Webhook delivery health |
| GET | `/api/dashboard/gmail` | List Gmail connections |
| GET | `/api/dashboard/gmail/connect` | Start Gmail OAuth |
| GET | `/api/dashboard/gmail/callback` | OAuth callback |
| GET | `/api/dashboard/analytics` | Analytics data |
| GET | `/api/dashboard/activity` | Activity log |
| GET | `/api/dashboard/notifications` | In-app notifications |
| GET | `/api/dashboard/billing` | Usage / plan limits |
| GET/POST | `/api/dashboard/team` | Team management |
| GET/POST | `/api/dashboard/security` | Security settings |
| GET/POST | `/api/dashboard/security/mfa` | TOTP MFA setup |
| GET/POST | `/api/dashboard/support` | Support tickets |

---

## Admin API

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/api/admin/legal` | Edit legal page content |
| GET/POST | `/api/admin/blog` | Blog CMS |

Requires `platformRole: ADMIN`.

---

## Other Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/contact` | Contact form submission |
| POST | `/api/auth/verify-turnstile` | Turnstile token verification |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/team/accept` | Accept team invite |
| GET/POST | `/api/uploadthing` | Logo uploads (dashboard) |

---

## Order Status Lifecycle

```
PENDING
  → (customer submits UTR) → UTR_SUBMITTED
  → (verification success) → VERIFIED
  → (verification failure) → FAILED
  → (window expired)       → EXPIRED / FAILED
```

---

## Rate Limits (Approximate)

| Endpoint | Limit |
|----------|-------|
| POST /api/v1/orders | 120/min per IP |
| POST /api/pay/*/verify | 30/min per IP |
| Dashboard APIs | Session-based |

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| unauthorized | 401 | Missing or invalid API key / session |
| invalid_request | 422 | Validation error |
| project_not_found | 404 | Project not found for API key |
| order_not_found | 404 | Order not found |
| rate_limited | 429 | Too many requests |
| invalid_utr | 422 | UTR validation or duplicate submission |

Verification failure reasons (in webhooks / order.failureReason):

- `EMAIL_NOT_FOUND`
- `UTR_ALREADY_USED`
- `AMOUNT_MISMATCH`
- `TIME_WINDOW_EXPIRED`
- `INVALID_TRANSACTION`
