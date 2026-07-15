import { prisma } from "@/lib/db/prisma";

type QueryEntry = { query: string; duration?: number };

let __currentCollector: Array<QueryEntry> | null = null;
let __registered = false;

if (!__registered) {
  // prisma.$on typing can be narrow in some builds; cast to `any` to
  // ensure we can listen for query events at runtime.
  (prisma as any).$on("query", (e: any) => {
    if (__currentCollector) {
      __currentCollector.push({ query: e.query, duration: e.duration });
    }
  });
  __registered = true;
}

export function attachPrismaQueryCollector(): Array<QueryEntry> {
  __currentCollector = [];
  return __currentCollector;
}

export function clearPrismaQueryCollector(): void {
  __currentCollector = null;
}
