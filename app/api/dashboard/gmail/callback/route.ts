import { redirect } from "next/navigation";
import { google } from "googleapis";
import { prisma } from "@/lib/db/prisma";
import { createGmailOAuthClient, parseOAuthState } from "@/lib/gmail/oauth";
import { encryptSecret } from "@/lib/security/crypto";
import { queues } from "@/lib/queues";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    redirect("/dashboard/gmail?error=missing_code");
  }

  let parsedState;
  try {
    parsedState = parseOAuthState(state);
  } catch {
    redirect("/dashboard/gmail?error=invalid_state");
  }

  const client = createGmailOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    logger.warn("Gmail OAuth callback missing tokens", { state: parsedState });
    redirect("/dashboard/gmail?error=missing_tokens");
  }

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email;

  if (!email) {
    logger.warn("Gmail OAuth callback missing email", { state: parsedState });
    redirect("/dashboard/gmail?error=missing_email");
  }

  const connection = await prisma.gmailConnection.upsert({
    where: {
      organizationId_googleEmail: {
        organizationId: parsedState.organizationId,
        googleEmail: email
      }
    },
    create: {
      organizationId: parsedState.organizationId,
      googleEmail: email,
      accessTokenEncrypted: encryptSecret(tokens.access_token),
      refreshTokenEncrypted: encryptSecret(tokens.refresh_token),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope ?? "gmail.readonly",
      status: "ACTIVE"
    },
    update: {
      accessTokenEncrypted: encryptSecret(tokens.access_token),
      refreshTokenEncrypted: encryptSecret(tokens.refresh_token),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      status: "ACTIVE",
      disconnectedAt: null,
      lastError: null
    }
  });

  logger.info("Gmail OAuth success", { organizationId: parsedState.organizationId, userId: parsedState.userId, googleEmail: email, connectionId: connection.id });
  if (queues) {
    await queues.gmailSync.add("sync", { gmailConnectionId: connection.id }, { attempts: 3 });
  }

  redirect("/dashboard/gmail?connected=1");
}
