import { prisma } from "@/lib/db/prisma";
import { resetDueSubscriptionsUsage } from "@/lib/services/billing";

async function main() {
  if (process.env.ALLOW_TEST_SUBSCRIPTION_RESET !== "1") {
    console.error(
      "Set ALLOW_TEST_SUBSCRIPTION_RESET=1 and ensure you're running against a dev DB before running this script."
    );
    process.exit(1);
  }

  const sub = await prisma.subscription.findFirst({ where: { status: "ACTIVE" } });
  if (!sub) {
    console.error("No active subscription found to test.");
    process.exit(1);
  }

  console.log("Before update:", {
    id: sub.id,
    organizationId: sub.organizationId,
    currentPeriodEnd: sub.currentPeriodEnd,
    verificationsUsed: sub.verificationsUsed,
  });

  // Move currentPeriodEnd to the past and ensure verificationsUsed is non-zero
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
      verificationsUsed: Math.max(1, sub.verificationsUsed ?? 1),
    },
  });

  console.log("Tagged subscription as due for reset.");

  const result = await resetDueSubscriptionsUsage();
  console.log("resetDueSubscriptionsUsage result:", result);

  const after = await prisma.subscription.findUnique({ where: { id: sub.id } });
  console.log("After reset:", {
    id: after?.id,
    currentPeriodEnd: after?.currentPeriodEnd,
    verificationsUsed: after?.verificationsUsed,
  });

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
