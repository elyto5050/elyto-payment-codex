import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";
import { decryptSecret } from "@/lib/security/crypto";
import { signWebhookPayload } from "@/lib/security/webhooks";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (!session?.user.organizationId) return apiError("unauthorized", "Sign in required.", 401);

  const { id } = await params;
  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: { id, project: { organizationId: session.user.organizationId } }
  });

  if (!endpoint) return apiError("not_found", "Webhook not found.", 404);

  const payload = JSON.stringify({
    event: "test.webhook",
    message: "This is a test event from Elyto",
    timestamp: new Date().toISOString()
  });

  const secret = decryptSecret(endpoint.secretHash);
  const { timestamp, signature } = signWebhookPayload(payload, secret);

  const start = Date.now();
  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Elyto-Signature": signature,
        "Elyto-Timestamp": String(timestamp),
        "Elyto-Event": "test.webhook"
      },
      body: payload,
      signal: AbortSignal.timeout(15_000)
    });

    const body = await response.text();
    return apiOk({
      success: response.ok,
      status: response.status,
      durationMs: Date.now() - start,
      responseBody: body.slice(0, 500)
    });
  } catch (error) {
    return apiOk({
      success: false,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Request failed"
    });
  }
}
