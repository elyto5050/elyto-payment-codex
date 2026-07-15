import { google } from "googleapis";
import crypto from "node:crypto";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email"
];

export function createGmailOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/dashboard/gmail/callback`
  );
}

export function getGmailAuthUrl(state: string) {
  const client = createGmailOAuthClient();
  const oauthUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state
  });
  console.log("GMAIL OAUTH URL:", oauthUrl);
  return oauthUrl;
}

export function createOAuthState(userId: string, organizationId: string) {
  const payload = JSON.stringify({ userId, organizationId, nonce: crypto.randomBytes(16).toString("hex") });
  return Buffer.from(payload).toString("base64url");
}

export function parseOAuthState(state: string) {
  const payload = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
    userId: string;
    organizationId: string;
  };
  return payload;
}
