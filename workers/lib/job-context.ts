import type { Job } from "bullmq";

export function getJobLogContext(job: Job) {
  return {
    jobId: job.id,
    projectId: job.data?.projectId,
    userId: job.data?.userId,
    paymentRef: job.data?.paymentRef,
    utr: job.data?.utr,
    gmailAccount: job.data?.gmailAccount
  };
}
