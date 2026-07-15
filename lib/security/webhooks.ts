import crypto from "node:crypto";
import { timingSafeEqual } from "@/lib/security/crypto";

export function signWebhookPayload(payload: string, secret: string, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  return {
    timestamp,
    signature: `v1=${signature}`
  };
}

export function verifyWebhookSignature(payload: string, secret: string, timestamp: string, signatureHeader: string) {
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) {
    return false;
  }

  const expected = signWebhookPayload(payload, secret, Number(timestamp)).signature;
  return timingSafeEqual(expected, signatureHeader);
}
