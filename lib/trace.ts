// Lightweight tracing helpers for request-local timing
export function startSpan(name: string) {
  const id = Math.random().toString(36).slice(2, 9);
  const start = process.hrtime.bigint();
  let ended = false;

  return {
    id,
    name,
    end(meta?: Record<string, unknown>) {
      if (ended) return null;
      ended = true;
      const dur = Number((process.hrtime.bigint() - start) / BigInt(1e6)); // ms
      const entry = { id, name, durationMs: dur, meta };
      try {
        // eslint-disable-next-line no-console
        console.info(`[trace] ${name} ${id} ${dur}ms`, meta ?? {});
      } catch (e) {
        // ignore logging errors
      }
      return entry;
    }
  };
}

export async function withSpan<T>(name: string, fn: () => Promise<T>) {
  const span = startSpan(name);
  try {
    const res = await fn();
    span.end();
    return res;
  } catch (err) {
    span.end({ error: String(err) });
    throw err;
  }
}
