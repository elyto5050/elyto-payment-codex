-- AlterEnum: add spec-aligned order statuses
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'UTR_SUBMITTED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'VERIFIED';

-- Migrate legacy statuses
UPDATE "Order" SET status = 'UTR_SUBMITTED' WHERE status = 'VERIFYING';
UPDATE "Order" SET status = 'VERIFIED' WHERE status = 'PAID';

-- Order verification metadata
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "matchedEmailId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "matchedUtr" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "verificationSource" TEXT;

-- Permanent verified UTR records (duplicate protection)
CREATE TABLE IF NOT EXISTS "VerifiedTransaction" (
    "id" TEXT NOT NULL,
    "utr" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "emailMessageId" TEXT,
    "verificationSource" TEXT NOT NULL DEFAULT 'gmail_fampay',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerifiedTransaction_orderId_key" ON "VerifiedTransaction"("orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "VerifiedTransaction_projectId_utr_key" ON "VerifiedTransaction"("projectId", "utr");
CREATE INDEX IF NOT EXISTS "VerifiedTransaction_utr_idx" ON "VerifiedTransaction"("utr");
CREATE INDEX IF NOT EXISTS "VerifiedTransaction_projectId_idx" ON "VerifiedTransaction"("projectId");

ALTER TABLE "VerifiedTransaction" DROP CONSTRAINT IF EXISTS "VerifiedTransaction_orderId_fkey";
ALTER TABLE "VerifiedTransaction" ADD CONSTRAINT "VerifiedTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VerifiedTransaction" DROP CONSTRAINT IF EXISTS "VerifiedTransaction_projectId_fkey";
ALTER TABLE "VerifiedTransaction" ADD CONSTRAINT "VerifiedTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
