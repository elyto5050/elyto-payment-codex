import { createLogger } from "@/lib/logger";

export function createQueueLogger(queue: string) {
  return createLogger({ queue });
}
