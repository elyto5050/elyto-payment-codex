import type { Job } from "bullmq";
import { QUEUE_CONFIG } from "@/workers/queues/config";
import { createManagedWorker } from "@/workers/lib/managed-worker";
import type { GmailSyncJob } from "@/workers/types/jobs";

export function startGmailWorker() {
  return createManagedWorker<GmailSyncJob>(QUEUE_CONFIG.gmail, async (job: Job<GmailSyncJob>) => {
    const { syncAllGmailConnections, syncGmailConnection } = await import("@/lib/gmail/sync");

    if (job.name === "sync-all") {
      return syncAllGmailConnections();
    }

    if (!job.data.gmailConnectionId) {
      throw new Error("missing_gmail_connection_id");
    }

    return syncGmailConnection(job.data.gmailConnectionId);
  });
}
