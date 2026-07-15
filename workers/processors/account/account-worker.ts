import { permanentlyDeleteAccount } from "@/lib/services/account";
import { QUEUE_CONFIG } from "@/workers/queues/config";
import { createManagedWorker } from "@/workers/lib/managed-worker";
import type { AccountDeletionJob } from "@/workers/types/jobs";

export function startAccountWorker() {
  return createManagedWorker<AccountDeletionJob>(QUEUE_CONFIG.account, async (job) => {
    if (job.name !== "delete-user") {
      return { skipped: true, reason: "unknown_job" };
    }

    if (!job.data.userId) {
      throw new Error("missing_user_id");
    }

    await permanentlyDeleteAccount(job.data.userId);
    return { deleted: true };
  });
}
