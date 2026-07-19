import "dotenv/config";

import { createLogger } from "@/lib/logger";
import { startHealthServer } from "@/workers/health/server";
import { validateWorkerEnv } from "@/workers/lib/env";
import { registerGracefulShutdown } from "@/workers/lib/shutdown";
import { closeScheduledQueues, registerSchedules } from "@/workers/scheduler/schedules";

const log = createLogger({ process: "scheduler" });

async function startScheduler() {
  const env = validateWorkerEnv();
  const server = startHealthServer("scheduler", env.SCHEDULER_PORT);

  await registerSchedules();
  log.info("Scheduled BullMQ jobs registered", {
    gmail: process.env.GMAIL_SYNC_CRON ?? "*/10 * * * *",
    analytics: process.env.ANALYTICS_CRON ?? "0 0 * * *",
    billing: process.env.BILLING_RESET_CRON ?? "0 2 * * *",
    healthPort: env.SCHEDULER_PORT
  });

  const reconcileTimer = setInterval(async () => {
    try {
      await registerSchedules();
      log.debug("Scheduled BullMQ jobs reconciled");
    } catch (error) {
      log.error("Scheduled BullMQ job reconciliation failed", { error });
    }
  }, 300_000);

  registerGracefulShutdown({
    server,
    close: [
      async () => {
        clearInterval(reconcileTimer);
      },
      closeScheduledQueues
    ]
  });
}

startScheduler().catch((error) => {
  log.error("Scheduler startup failed", { error });
  process.exit(1);
});
