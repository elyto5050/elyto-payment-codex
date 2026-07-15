import { prisma } from "@/lib/db/prisma";
import { queues } from "@/lib/queues";

export async function scheduleAccountDeletion(userId: string, delayMs = 7 * 24 * 60 * 60 * 1000) {
  if (queues?.accountDeletion) {
    await queues.accountDeletion.add("delete-user", { userId }, { delay: delayMs });
    return { scheduled: true };
  }

  // Fallback: immediate permanent deletion
  await permanentlyDeleteAccount(userId);
  return { scheduled: false, deleted: true };
}

export async function permanentlyDeleteAccount(userId: string) {
  // Perform any pre-delete cleanup here if necessary.
  await prisma.user.delete({ where: { id: userId } });
  return { deleted: true };
}
