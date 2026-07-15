-- Create SubscriptionPlan enum type
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'GROWTH', 'SCALE');

-- Create SubscriptionStatus enum type
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING');

-- Alter Subscription table to use enums
ALTER TABLE "Subscription"
  ADD COLUMN "plan_enum" "SubscriptionPlan" DEFAULT 'STARTER',
  ADD COLUMN "status_enum" "SubscriptionStatus" DEFAULT 'ACTIVE';

-- Migrate data from TEXT to enum
UPDATE "Subscription" SET "plan_enum" = "plan"::"SubscriptionPlan";
UPDATE "Subscription" SET "status_enum" = "status"::"SubscriptionStatus";

-- Drop old TEXT columns
ALTER TABLE "Subscription" DROP COLUMN "plan";
ALTER TABLE "Subscription" DROP COLUMN "status";

-- Rename new enum columns to original names
ALTER TABLE "Subscription" RENAME COLUMN "plan_enum" TO "plan";
ALTER TABLE "Subscription" RENAME COLUMN "status_enum" TO "status";

-- Make columns NOT NULL
ALTER TABLE "Subscription" ALTER COLUMN "plan" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "status" SET NOT NULL;
