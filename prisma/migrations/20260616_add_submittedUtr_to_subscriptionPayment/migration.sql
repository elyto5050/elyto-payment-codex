-- Migration: add submittedUtr to SubscriptionPayment
ALTER TABLE "SubscriptionPayment" ADD COLUMN IF NOT EXISTS "submittedUtr" TEXT;
CREATE INDEX IF NOT EXISTS "SubscriptionPayment_submittedUtr_idx" ON "SubscriptionPayment" ("submittedUtr");
