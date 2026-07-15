import crypto from "node:crypto";
import { hashWithPepper } from "@/lib/security/crypto";

type KeyKind = "pk" | "sk";
type Environment = "test" | "live";

export function createApiKey(kind: KeyKind, environment: Environment = "live") {
  const raw = crypto.randomBytes(32).toString("base64url");
  const prefix = `elyto_${kind}_${environment}`;
  const key = `${prefix}_${raw}`;

  return {
    key,
    keyPrefix: key.slice(0, 22),
    keyHash: hashWithPepper(key)
  };
}

export function hashApiKey(key: string) {
  return hashWithPepper(key);
}
