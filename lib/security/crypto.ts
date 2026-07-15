import crypto from "node:crypto";

const algorithm = "aes-256-gcm";

function getKey() {
  const configured = process.env.ENCRYPTION_KEY;
  if (!configured) {
    throw new Error("ENCRYPTION_KEY is required for secret encryption.");
  }

  const decoded = Buffer.from(configured, "base64");
  if (decoded.length === 32) {
    return decoded;
  }

  return crypto.createHash("sha256").update(configured).digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(payload: string) {
  const [iv, tag, encrypted] = payload.split(".");
  if (!iv || !tag || !encrypted) {
    throw new Error("Invalid encrypted payload.");
  }

  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final()
  ]).toString("utf8");
}

export function hashWithPepper(value: string, pepper = process.env.API_KEY_PEPPER ?? "") {
  return crypto.createHash("sha256").update(`${value}.${pepper}`).digest("hex");
}

export function timingSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
