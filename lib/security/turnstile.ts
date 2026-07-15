export async function verifyTurnstileToken(token: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: true, skipped: true };
  }

  const body = new URLSearchParams({
    secret,
    response: token
  });

  if (ip) {
    body.set("remoteip", ip);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const data = (await response.json()) as { success: boolean; "error-codes"?: string[] };
  return { success: data.success, skipped: false, errors: data["error-codes"] };
}
