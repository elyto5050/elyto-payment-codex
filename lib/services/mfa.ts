import crypto from "node:crypto";
import { encryptSecret, decryptSecret } from "@/lib/security/crypto";
import { prisma } from "@/lib/db/prisma";

export function generateMfaSecret() {
  const secret = crypto.randomBytes(20).toString("base64url").slice(0, 16);
  return secret;
}

export function getMfaUri(email: string, secret: string) {
  const issuer = "Elyto";
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

export async function enableMfa(userId: string, secret: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true, mfaSecretEncrypted: encryptSecret(secret) }
  });
}

export async function disableMfa(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: false, mfaSecretEncrypted: null }
  });
}

export async function getMfaStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true }
  });
  return { enabled: user?.mfaEnabled ?? false };
}

export function verifyTotpCode(secret: string, code: string) {
  const timeStep = 30;
  const digits = 6;
  const counter = Math.floor(Date.now() / 1000 / timeStep);

  for (const offset of [-1, 0, 1]) {
    const expected = hotp(secret, counter + offset, digits);
    if (expected === code) return true;
  }
  return false;
}

export async function verifyUserMfa(userId: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaSecretEncrypted: true }
  });
  if (!user?.mfaEnabled || !user.mfaSecretEncrypted) return false;
  const secret = decryptSecret(user.mfaSecretEncrypted);
  return verifyTotpCode(secret, code);
}

function hotp(secret: string, counter: number, digits: number) {
  const key = Buffer.from(secret, "utf8");
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const code = ((hmac[offset]! & 0x7f) << 24) | ((hmac[offset + 1]! & 0xff) << 16) | ((hmac[offset + 2]! & 0xff) << 8) | (hmac[offset + 3]! & 0xff);
  return String(code % 10 ** digits).padStart(digits, "0");
}
