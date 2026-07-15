export async function apiFetch(path: string, options?: RequestInit & { timeoutMs?: number }) {
  const { timeoutMs = 10000, ...init } = options ?? {};
  const controller = new AbortController();
  const signal = controller.signal;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = path.startsWith("http") ? path : (typeof window !== "undefined" ? `${window.location.origin}${path}` : path);
    const res = await fetch(url, { credentials: "same-origin", signal, ...init } as RequestInit);
    clearTimeout(timer);

    // Attempt to read text then JSON (some endpoints return plain text)
    let text: string | null = null;
    try {
      text = await res.text();
    } catch (e) {
      text = null;
    }

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      json = null;
    }

    if (!res.ok) {
      const message = json?.error?.message || json?.message || res.statusText || `Request failed with status ${res.status}`;
      const err: any = new Error(message);
      err.status = res.status;
      err.body = json;
      throw err;
    }

    // Prefer API "data" envelope when present
    if (json && Object.prototype.hasOwnProperty.call(json, "data")) return json.data;
    if (json) return json;
    return text;
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      const e = new Error("Network timeout");
      (e as any).status = 0;
      throw e;
    }
    throw err;
  }
}

export default apiFetch;
