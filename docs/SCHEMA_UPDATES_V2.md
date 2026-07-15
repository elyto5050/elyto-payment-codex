/**
 * Database Schema Updates for Elyto v2.0
 * 
 * New tables and fields required for:
 * 1. RBAC System (50+ permission management)
 * 2. Billing System (quota tracking, subscription management)
 * 3. Self-Billing Infrastructure (subscription payments)
 * 4. Support Ticket System (ticket creation and management)
 * 5. Admin Audit Logs
 * 
 * This file documents the schema changes needed in Prisma
 * Add these to your prisma/schema.prisma file
 *
 * NOTE: Plan metadata (prices, project limits, verification limits, and support levels)
 * is centralized in `lib/plans.ts`. Do not duplicate pricing or limits in code or docs;
 * import values from `lib/plans.ts` when referencing plan attributes in runtime code.
 */

// ============================================================================
// 1. RBAC SYSTEM TABLES
// ============================================================================

/**
model CustomAdminRole {
  id                String   @id @default(cuid())
  name              String   @unique
  description       String?
  permissions       String[] // Array of permission keys like ["users:edit", "billing:view-revenue"]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  staffRoles        StaffRole[]
  
  @@index([name])
}

model StaffRole {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  customRoleId      String?
  customRole        CustomAdminRole? @relation(fields: [customRoleId], references: [id])
  
  // Custom permissions override
  customPermissions String[] // Array of permission keys
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId])
  @@index([customRoleId])
}
*/

// ============================================================================
// 2. BILLING SYSTEM TABLES
// ============================================================================

/**
model BillingRecord {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  email                 String
  currentPlan           String   @default("FREE") // FREE, PREMIUM_1, PREMIUM_2, PREMIUM_3, ENTERPRISE
  verificationCount     Int      @default(0) // Total successful verifications
  projectCount          Int      @default(0) // Current project count
  
  // Billing dates
  cycleStartDate        DateTime @default(now())
  lastBillingDate       DateTime @default(now())
  nextBillingDate       DateTime? // Nullable until first upgrade
  
  isActive              Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  subscriptions         Subscription[]
  auditLogs             BillingAuditLog[]
  
  @@index([userId])
  @@index([currentPlan])
}

model BillingAuditLog {
  id                String   @id @default(cuid())
  userId            String
  billingRecord     BillingRecord @relation(fields: [userId], references: [userId], onDelete: Cascade)
  
  eventType         String   // UPGRADE, DOWNGRADE, ADJUSTMENT, CANCEL, etc.
  metadata          Json     // Flexible metadata for event details
  timestamp         DateTime @default(now())
  
  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
}
*/

// ============================================================================
// 3. SELF-BILLING INFRASTRUCTURE TABLES
// ============================================================================

/**
model SubscriptionPayment {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  userEmail         String
  planTier          String   // PREMIUM_1, PREMIUM_2, PREMIUM_3, ENTERPRISE
  amount            Int      // Amount in paise (e.g., 8900 for ₹89)
  
  paymentRef        String   @unique // SUB_userid_timestamp format
  status            String   @default("PENDING") // PENDING, VERIFIED, FAILED, EXPIRED
  targetUPI         String   // Should be "aviralji@fam"
  
  verifiedAt        DateTime?
  transactionHash   String?  // From Gmail webhook
  
  expiresAt         DateTime // Payment window (30 minutes)
  metadata          Json?    // Additional payment metadata
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  subscription      Subscription?
  
  @@index([userId])
  @@index([status])
  @@index([paymentRef])
  @@index([expiresAt])
}

model Subscription {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  plan              String   // PREMIUM_1, PREMIUM_2, PREMIUM_3, ENTERPRISE
  paymentId         String   @unique
  payment           SubscriptionPayment @relation(fields: [paymentId], references: [id])
  
  startDate         DateTime
  renewalDate       DateTime // When subscription expires
  
  isActive          Boolean  @default(true)
  cancelledAt       DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  auditLogs         SubscriptionAuditLog[]
  
  @@index([userId])
  @@index([plan])
}

model SubscriptionAuditLog {
  id                String   @id @default(cuid())
  userId            String
  subscription      Subscription @relation(fields: [userId], references: [userId], onDelete: Cascade)
  
  eventType         String   // SUBSCRIPTION_ACTIVATED, RENEWAL, CANCELLED, etc.
  metadata          Json
  timestamp         DateTime @default(now())
  
  @@index([userId])
  @@index([eventType])
}
*/

// ============================================================================
// 4. SUPPORT TICKET SYSTEM TABLES
// ============================================================================

/**
model SupportTicket {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  ticketRef         String   @unique // TKT + timestamp
  subject           String
  description       String   @db.Text
  category          String   // BUG, FEATURE_REQUEST, BILLING, TECHNICAL, ACCOUNT, OTHER
  priority          String   @default("MEDIUM") // LOW, MEDIUM, HIGH, CRITICAL
  status            String   @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED, CLOSED, ESCALATED
  
  userEmail         String
  assignedToId      String?  // ID of support agent
  
  isAiInitiated     Boolean  @default(true)
  resolution        String?  @db.Text
  
  escalationReason  String?
  escalatedAt       DateTime?
  resolvedAt        DateTime?
  closedAt          DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  messages          TicketMessage[]
  
  @@index([userId])
  @@index([status])
  @@index([priority])
  @@index([assignedToId])
  @@index([ticketRef])
}

model TicketMessage {
  id                String   @id @default(cuid())
  ticketId          String
  ticket            SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  senderId          String   // User ID or "SYSTEM_AI"
  senderType        String   // USER, SUPPORT, ADMIN, AI
  message           String   @db.Text
  
  isAiGenerated     Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  
  @@index([ticketId])
  @@index([senderId])
}
*/

// ============================================================================
// 5. AUDIT LOG TABLE (for admin actions)
// ============================================================================

/**
model AuditLog {
  id                String   @id @default(cuid())
  action            String   // Action name like "USER_SUSPENDED", "PLAN_UPGRADED", etc.
  userId            String   // Admin/staff who performed action
  user              User     @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  targetUserId      String?  // User affected by action (if applicable)
  targetId          String?  // Generic target ID for other entities
  
  metadata          Json     // Flexible metadata for action details
  ipAddress         String?
  userAgent         String?
  
  createdAt         DateTime @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([targetUserId])
  @@index([createdAt])
}
*/

// ============================================================================
// DATABASE MIGRATION GUIDE
// ============================================================================

/*
To implement these schema changes:

1. Add the above models to prisma/schema.prisma

2. Create migration:
   npx prisma migrate dev --name add_v2_rbac_billing_support

3. Update relations on existing User model:
   model User {
     // ... existing fields ...
     
     // Add these relations
     staffRole         StaffRole?
     billingRecord     BillingRecord?
     subscriptions     SubscriptionPayment[]
     supportTickets    SupportTicket[]
     auditLogs         AuditLog[]
   }

4. Run migrations:
   npx prisma migrate deploy

5. Generate Prisma client:
   npx prisma generate
*/

// ============================================================================
// INDEX STRATEGY
// ============================================================================

/*
Performance indexes created:
- BillingRecord.currentPlan (for filtering by plan)
- SubscriptionPayment.status (for checking pending payments)
- SubscriptionPayment.paymentRef (for webhook lookups)
- SubscriptionPayment.expiresAt (for cleanup queries)
- SupportTicket.status (for filtering by status)
- SupportTicket.priority (for sorting)
- SupportTicket.assignedToId (for agent dashboards)
- AuditLog.action (for audit trail filtering)
- AuditLog.createdAt (for time-range queries)
*/

// ============================================================================
// IMPORTANT NOTES
// ============================================================================

/*
1. VERIFICATION COUNTER SEMANTICS:
   - Only incremented on SUCCESSFUL payment verification
   - Never decremented (cumulative)
   - Quota check happens before attempting verification
   - Enterprise plan (PREMIUM_3, ENTERPRISE) has unlimited quota

2. SUBSCRIPTION PAYMENT FLOW:
   - Payment created with status: PENDING
   - Webhook from Gmail detects UPI payment to aviralji@fam
   - Webhook handler verifies amount matches
   - Payment updated to: VERIFIED
   - Subscription created, user plan upgraded, quota unlocked
   - User gets notification on dashboard

3. RBAC PERMISSION MODEL:
   - 50+ granular permissions
   - 5 default roles (OWNER, ADMIN, SUPPORT, BILLING, MODERATOR)
   - Custom roles can be created with any permission combination
   - Permissions stored as string array in database
   - Runtime type-checking against RBAC_PERMISSIONS constant

4. SUPPORT TICKET SYSTEM:
   - AI-initiated (automatic greeting)
   - Category and priority auto-detected from issue text
   - Support agents can assign, respond, escalate
   - Notifications sent to user on support response
   - Audit trail of all actions
*/
