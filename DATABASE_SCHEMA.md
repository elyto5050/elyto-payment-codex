# Elyto — Database Schema

PostgreSQL database managed by Prisma. All timestamps are UTC `DateTime`.

---

## Entity Relationship Overview

```
Organization
  ├── TeamMember → User
  ├── Project
  │     ├── Product
  │     ├── Order
  │     │     └── VerifiedTransaction (1:1, permanent UTR record)
  │     ├── Transaction (parsed Gmail cache, pre-match)
  │     ├── WebhookEndpoint
  │     └── WebhookEvent → WebhookDelivery
  ├── GmailConnection → Transaction, GmailSyncLog
  ├── ApiKey
  ├── Subscription (usage limits only)
  └── AuditLog, ActivityLog, Notification, SupportTicket

User → Account, Session, LoginHistory, SecurityEvent
PlatformContent, BlogPost (CMS)
```

---

## Core Verification Models

### Order

Represents a payment verification request. Money is paid directly to merchant UPI.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Internal ID |
| publicId | String (unique) | Public order ID (`ord_...`), used in URLs/API |
| projectId | String | FK → Project |
| productId | String? | FK → Product |
| customerName | String? | |
| customerEmail | String? | |
| amount | Decimal(12,2) | Expected payment amount |
| currency | String | Default `INR` |
| status | OrderStatus | See enum below |
| submittedUtr | String? | UTR submitted by customer |
| verifiedTransactionId | String? (unique) | FK → Transaction (parsed email match) |
| failureReason | String? | e.g. `UTR_ALREADY_USED`, `AMOUNT_MISMATCH` |
| matchedEmailId | String? | Gmail message ID of matched email |
| matchedUtr | String? | UTR that verified the order |
| verificationSource | String? | e.g. `gmail_fampay` |
| expiresAt | DateTime? | Payment window expiry (30 min from creation) |
| verifiedAt | DateTime? | When verification succeeded |
| failedAt | DateTime? | When verification failed |
| createdAt, updatedAt | DateTime | |

**Indexes:** projectId, productId, status, submittedUtr, customerEmail, createdAt

### VerifiedTransaction

**Permanent record of every successfully verified UTR.** Prevents UTR reuse (one payment = one order).

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | |
| utr | String | Unique per project |
| amount | Decimal(12,2) | Verified amount |
| timestamp | DateTime | Transaction timestamp from email |
| orderId | String (unique) | FK → Order |
| projectId | String | FK → Project |
| emailMessageId | String? | Gmail message ID |
| verificationSource | String | Default `gmail_fampay` |
| createdAt | DateTime | |

**Constraints:** `@@unique([projectId, utr])`, `@@unique([orderId])`

### Transaction

Temporary verification cache — parsed Gmail emails before order matching.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | |
| projectId | String | FK → Project |
| gmailConnectionId | String? | FK → GmailConnection |
| emailMessageId | String? (unique) | Gmail message ID |
| emailThreadId | String? | |
| utr | String | Parsed UTR |
| amount | Decimal(12,2) | Parsed amount |
| currency | String | Default `INR` |
| sender | String? | Parsed sender |
| referenceNumber | String? | Transaction reference |
| source | String? | e.g. `gmail_fampay` |
| status | TransactionStatus | UNMATCHED, USED, DUPLICATE, etc. |
| receivedAt | DateTime | Email/payment timestamp |
| parsedAt | DateTime | When parsed |
| usedAt | DateTime? | When matched to an order |
| rawSnippetEncrypted | String? | Encrypted email snippet |

**Constraints:** `@@unique([projectId, utr])`, `@@unique([emailMessageId])`

---

## Gmail Models

### GmailConnection

| Field | Type | Description |
|-------|------|-------------|
| id | String | |
| organizationId | String | FK → Organization |
| googleEmail | String | Connected Gmail address |
| accessTokenEncrypted | String | **Encrypted** OAuth access token |
| refreshTokenEncrypted | String | **Encrypted** OAuth refresh token |
| tokenExpiresAt | DateTime? | |
| scope | String | OAuth scopes granted |
| status | GmailConnectionStatus | ACTIVE, DISCONNECTED, ERROR, EXPIRED |
| historyId | String? | Gmail sync cursor |
| lastSyncAt | DateTime? | |
| lastErrorAt, lastError | | Last sync failure |
| disconnectedAt | DateTime? | |

**Constraint:** `@@unique([organizationId, googleEmail])`

### GmailSyncLog

Audit trail for each sync run: messagesScanned, transactionsFound, status, errors.

---

## Multi-Tenant Models

### Organization

Tenant root. Created on user signup. Has projects, team, Gmail, API keys, subscription.

### Project

Merchant integration. Stores `upiId` for checkout QR, `publicKey`/`secretKeyHash` for API auth.

### Product

Optional catalog item linked to orders (name, price, planType).

### ApiKey

Hashed secret keys (`keyHash`) with prefix, type (PUBLIC/SECRET), environment (TEST/LIVE), scopes.

### WebhookEndpoint

Merchant webhook URL with hashed secret, subscribed events list.

### WebhookEvent / WebhookDelivery

Event log + per-endpoint delivery attempts with retry status.

---

## Auth Models (NextAuth)

- **User** — email, platformRole (USER/ADMIN/SUPPORT), MFA fields
- **Account** — OAuth provider accounts
- **Session** — active sessions with IP/userAgent
- **VerificationToken** — magic link tokens

---

## Audit & Analytics

| Model | Purpose |
|-------|---------|
| AuditLog | Security-sensitive changes (before/after JSON) |
| ActivityLog | User actions in dashboard |
| AnalyticsEvent | Project-level events |
| DailyMetric | Aggregated daily revenue, orders, verification rate |
| LoginHistory | Login attempts |
| SecurityEvent | MFA, suspicious activity |

---

## Platform Models

| Model | Purpose |
|-------|---------|
| PlatformContent | Editable legal pages (privacy, terms) |
| BlogPost | Admin CMS blog |
| Subscription | Verification usage limits (Starter/Growth/Scale) — **not payment processing** |
| Notification | In-app notifications |
| SupportTicket / SupportTicketMessage | Support system |
| TeamMember / TeamInvite | Organization team RBAC |

---

## Enums

### OrderStatus

| Value | Meaning |
|-------|---------|
| PENDING | Order created, awaiting payment |
| UTR_SUBMITTED | Customer submitted UTR, verification in progress |
| VERIFIED | Payment verified successfully |
| FAILED | Verification failed |
| EXPIRED | Order payment window expired |
| CANCELLED | Order cancelled |
| REFUNDED | Legacy/refund marker |
| VERIFYING | **Legacy** — maps to UTR_SUBMITTED |
| PAID | **Legacy** — maps to VERIFIED |

### TransactionStatus

`UNMATCHED`, `MATCHED`, `USED`, `DUPLICATE`, `IGNORED`, `SUSPICIOUS`

### Verification Failure Reasons (stored on Order.failureReason)

- `EMAIL_NOT_FOUND` — No matching Gmail transaction
- `UTR_ALREADY_USED` — UTR previously verified for another order
- `AMOUNT_MISMATCH` — Parsed amount ≠ order amount
- `TIME_WINDOW_EXPIRED` — Payment outside 30-minute window
- `INVALID_TRANSACTION` — Email indicates failed/suspicious payment
- `DUPLICATE_SUBMISSION` — UTR submitted on multiple orders

### Other Enums

- **TeamRole:** OWNER, ADMIN, MANAGER, VIEWER
- **PlatformRole:** USER, ADMIN, SUPPORT
- **GmailConnectionStatus:** ACTIVE, DISCONNECTED, ERROR, EXPIRED
- **WebhookDeliveryStatus:** PENDING, SUCCESS, FAILED, RETRYING, CANCELLED
- **SubscriptionPlan:** STARTER, GROWTH, SCALE

---

## Migrations

Located in `prisma/migrations/`:

| Migration | Description |
|-----------|-------------|
| `20250610000000_init` | Initial schema |
| `20250610120000_platform_content` | PlatformContent CMS |
| `20250610140000_phase3` | Subscription, BlogPost, MFA |
| `20250610160000_verification_spec` | VerifiedTransaction, order verification fields, UTR_SUBMITTED/VERIFIED |

Apply with:

```bash
npm run prisma:deploy   # production
npm run prisma:migrate   # development
```

---

## Security Notes

- Gmail tokens: **never** stored in plain text — always `*Encrypted` fields via `lib/security/crypto.ts`
- API keys: stored as HMAC hashes with pepper
- Webhook secrets: stored encrypted/hashed
- UTR uniqueness enforced at DB level via `VerifiedTransaction`
