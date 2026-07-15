import { prisma } from "@/lib/db/prisma";
import { signWebhookPayload } from "@/lib/security/webhooks";
import { decryptSecret } from "@/lib/security/crypto";
import { logger } from "@/lib/logger";

export async function deliverWebhookEvent(eventId: string) {
  const event = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
    include: {
      project: {
        include: {
          webhooks: { where: { status: "ACTIVE", disabledAt: null } }
        }
      }
    }
  });

  if (!event) {
    return { delivered: false, reason: "event_not_found" };
  }

  const endpoints = event.project.webhooks.filter((ep) => ep.events.length === 0 || ep.events.includes(event.type));

  if (endpoints.length === 0) {
    return { delivered: false, reason: "no_endpoints" };
  }

  const payload = JSON.stringify(event.payload);
  const results = [];

  for (const endpoint of endpoints) {
    let delivery = await prisma.webhookDelivery.findFirst({
      where: { eventId: event.id, endpointId: endpoint.id }
    });

    if (!delivery) {
      delivery = await prisma.webhookDelivery.create({
        data: { eventId: event.id, endpointId: endpoint.id, status: "PENDING" }
      });
    }

    const start = Date.now();
    try {
      const secret = decryptSecret(endpoint.secretHash);
      const { timestamp, signature } = signWebhookPayload(payload, secret);

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Elyto-Signature": signature,
          "Elyto-Timestamp": String(timestamp),
          "Elyto-Event": event.type
        },
        body: payload,
        signal: AbortSignal.timeout(15_000)
      });

      const body = await response.text().catch(() => "");
      const durationMs = Date.now() - start;

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: response.ok ? "SUCCESS" : "FAILED",
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
          responseStatus: response.status,
          responseBody: body.slice(0, 2000),
          durationMs,
          errorMessage: response.ok ? null : `HTTP ${response.status}`
        }
      });

      results.push({ endpointId: endpoint.id, ok: response.ok });
    } catch (error) {
      const durationMs = Date.now() - start;
      const message = error instanceof Error ? error.message : "delivery_failed";

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
          durationMs,
          errorMessage: message
        }
      });

      logger.error("Webhook delivery failed", { eventId, endpointId: endpoint.id, message });
      results.push({ endpointId: endpoint.id, ok: false });
    }
  }

  return { delivered: results.some((r) => r.ok), results };
}
