import { google } from "googleapis";
import { OrderStatus, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { parseFamPayEmail } from "@/lib/gmail/parser";
import { handleSubscriptionPaymentWebhook, SELF_BILLING_CONFIG } from "@/lib/billing/self-billing";
import { logger } from "@/lib/logger";
import { queues } from "@/lib/queues";

const FAMPAY_SENDER_ALLOWLIST = ["fampay.in", "famapp.in"];

function getHeaderValue(headers: Array<{ name?: string | null; value?: string | null }>, headerName: string) {
  return headers.find((h) => h.name?.toLowerCase() === headerName.toLowerCase())?.value?.trim() ?? "";
}

function isAllowedSender(from: string) {
  const normalized = from.toLowerCase();
  return FAMPAY_SENDER_ALLOWLIST.some((domain) => normalized.includes(domain));
}

export async function syncGmailConnection(gmailConnectionId: string) {
  const connection = await prisma.gmailConnection.findUnique({
    where: { id: gmailConnectionId },
    include: { organization: { include: { projects: { where: { deletedAt: null } } } } }
  });

  if (!connection || connection.status !== "ACTIVE") {
    return { synced: false, reason: "connection_inactive" };
  }

  const log = await prisma.gmailSyncLog.create({
    data: { gmailConnectionId, status: "STARTED" }
  });

  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2.setCredentials({
      access_token: decryptSecret(connection.accessTokenEncrypted),
      refresh_token: decryptSecret(connection.refreshTokenEncrypted)
    });

    oauth2.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        await prisma.gmailConnection.update({
          where: { id: connection.id },
          data: {
            accessTokenEncrypted: encryptSecret(tokens.access_token),
            tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
          }
        });
      }
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2 });
    const projects = connection.organization.projects;
    let messageIds: string[] = [];
    let newHistoryId = connection.historyId;

    if (connection.historyId) {
      try {
        const historyResult = await gmail.users.history.list({
          userId: "me",
          startHistoryId: connection.historyId,
          historyTypes: ["messageAdded"],
          maxResults: 100
        });

        for (const historyItem of historyResult.data.history ?? []) {
          for (const message of historyItem.messages ?? []) {
            if (message.id) {
              messageIds.push(message.id);
            }
          }
        }

        if (historyResult.data.historyId) {
          newHistoryId = historyResult.data.historyId;
        }
      } catch (error) {
        logger.warn("Gmail history sync failed, falling back to search", {
          gmailConnectionId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (messageIds.length === 0) {
      const searchQuery = "(from:(fampay.in OR famapp.in) OR subject:(\"Your payment of\" OR \"payment of\" OR fampay OR FamPay)) newer_than:30d";
      logger.info("Gmail search started", { gmailConnectionId, searchQuery });
      // Use an efficient Gmail search filter focused on FamPay senders and subjects
      const list = await gmail.users.messages.list({
        userId: "me",
        q: searchQuery,
        maxResults: 100
      });
      messageIds = (list.data.messages ?? []).map((message) => message.id).filter(Boolean) as string[];
      logger.info("Gmail search completed", { gmailConnectionId, searchQuery, messageIdsReturned: messageIds.length });
    }

    let transactionsFound = 0;

    for (const messageId of messageIds) {
      if (!messageId) {
        logger.info("Skipping Gmail message", { gmailConnectionId, reason: "missing_message_id" });
        continue;
      }

      // Skip messages already processed globally
      const existing = await prisma.transaction.findUnique({ where: { emailMessageId: messageId } });
      if (existing) {
        logger.info("Skipping Gmail message", { gmailConnectionId, messageId, reason: "duplicate_emailMessageId", transactionId: existing.id });
        continue;
      }

      const detail = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
      const headers = detail.data.payload?.headers ?? [];
      const fromHeader = getHeaderValue(headers, "From");
      const subject = getHeaderValue(headers, "Subject");
      const dateHeader = headers.find((h) => h.name?.toLowerCase() === "date")?.value;
      const receivedAt = dateHeader ? new Date(dateHeader) : new Date();

      logger.info("Fetched Gmail message", {
        gmailConnectionId,
        messageId,
        from: fromHeader,
        subject,
        date: dateHeader ?? receivedAt.toISOString()
      });

      // Allowlist by domain is helpful but don't rely exclusively on it — subject+body parsing is authoritative
      if (!isAllowedSender(fromHeader) && !/payment of|Your payment of|fampay|famapp/i.test(subject)) {
        logger.info("Skipping Gmail message", { gmailConnectionId, messageId, reason: "sender_rejected", from: fromHeader, subject });
        continue;
      }

      const body = extractEmailBody(detail.data.payload);
      // Use strict parser: must return amount + utr
      const parsed = parseFamPayEmail(body, receivedAt, subject);
      if (!parsed) {
        logger.warn("Skipping Gmail message", { gmailConnectionId, messageId, reason: "parser_returned_null", subject, from: fromHeader, date: dateHeader ?? receivedAt.toISOString() });
        continue;
      }

      // Check for any pending self-billing subscription payments submitted by the owner
      try {
        const ownerId = connection.organization?.ownerId;
        if (ownerId) {
          const subPayment = await prisma.subscriptionPayment.findFirst({
            where: {
              submittedUtr: parsed.utr,
              userId: ownerId,
              status: "PENDING",
              expiresAt: { gt: new Date() },
              amount: parsed.amount
            }
          });

          if (subPayment) {
            // Attempt automated subscription verification
            try {
              await handleSubscriptionPaymentWebhook({
                from: parsed.sender ?? subPayment.userEmail,
                to: SELF_BILLING_CONFIG.UPI_DESTINATION,
                amount: Number(parsed.amount),
                transactionHash: messageId,
                paymentRef: subPayment.paymentRef,
                timestamp: parsed.receivedAt.toISOString()
              } as any);
            } catch (err) {
              logger.warn("Automated subscription verification failed", { error: err instanceof Error ? err.message : String(err), messageId, paymentRef: subPayment.paymentRef });
            }
          }
        }
      } catch (err) {
        // continue normal processing even if subscription match logic fails
        logger.warn("Subscription match check failed", { error: err instanceof Error ? err.message : String(err) });
      }

      for (const project of projects) {
        // Duplicate protection: check by emailMessageId first
        const alreadyProcessed = await prisma.transaction.findUnique({ where: { emailMessageId: messageId } });
        if (alreadyProcessed) {
          logger.info("Skipping Gmail message", { gmailConnectionId, messageId, reason: "duplicate_emailMessageId", projectId: project.id });
          continue;
        }

        // Also ensure UTR uniqueness per project; if utr already verified or used, skip
        const utrExists = await prisma.transaction.findFirst({ where: { projectId: project.id, utr: parsed.utr } });
        if (utrExists) {
          logger.info("Skipping Gmail message", { gmailConnectionId, messageId, reason: "duplicate_utr", projectId: project.id, utr: parsed.utr });
          continue;
        }

        logger.info("Creating transaction from Gmail message", {
          gmailConnectionId,
          messageId,
          projectId: project.id,
          utr: parsed.utr,
          amount: parsed.amount,
          sender: parsed.sender
        });

        try {
          await prisma.transaction.create({
            data: {
              projectId: project.id,
              gmailConnectionId: connection.id,
              emailMessageId: messageId,
              utr: parsed.utr,
              amount: parsed.amount,
              sender: parsed.sender,
              referenceNumber: parsed.referenceNumber,
              source: parsed.source,
              status: TransactionStatus.UNMATCHED,
              receivedAt: parsed.receivedAt
            }
          });
        } catch (error) {
          logger.error("Failed to create transaction from Gmail message", {
            gmailConnectionId,
            messageId,
            projectId: project.id,
            utr: parsed.utr,
            amount: parsed.amount,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }

        transactionsFound += 1;

        const pendingOrder = await prisma.order.findFirst({
          where: {
            projectId: project.id,
            submittedUtr: parsed.utr,
            status: { in: [OrderStatus.UTR_SUBMITTED, OrderStatus.VERIFYING] }
          }
        });

        if (pendingOrder) {
          if (queues) {
            try {
              await queues.paymentVerification.add("verify-order", { orderPublicId: pendingOrder.publicId });
            } catch (err) {
              logger.warn("Failed to enqueue payment-verification; falling back to local verification", { error: err instanceof Error ? err.message : String(err), orderPublicId: pendingOrder.publicId });
              try {
                const { verifyOrderByUtr } = await import("@/lib/services/verification");
                await verifyOrderByUtr(pendingOrder.publicId);
              } catch (err2) {
                logger.warn("Local verification fallback failed", { error: err2 instanceof Error ? err2.message : String(err2), orderPublicId: pendingOrder.publicId });
              }
            }
          } else {
            try {
              const { verifyOrderByUtr } = await import("@/lib/services/verification");
              await verifyOrderByUtr(pendingOrder.publicId);
            } catch (err) {
              logger.warn("Local verification fallback failed", { error: err instanceof Error ? err.message : String(err), orderPublicId: pendingOrder.publicId });
            }
          }
        }
      }
    }

    if (newHistoryId && newHistoryId !== connection.historyId) {
      await prisma.gmailConnection.update({
        where: { id: connection.id },
        data: { historyId: newHistoryId }
      });
    }

    await prisma.gmailConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date(), lastError: null }
    });

    logger.info("Gmail sync succeeded", { gmailConnectionId, transactionsFound, messagesScanned: messageIds.length });

    await prisma.gmailSyncLog.update({
      where: { id: log.id },
      data: {
        status: "SUCCESS",
        messagesScanned: messageIds.length,
        transactionsFound,
        completedAt: new Date()
      }
    });

    return { synced: true, transactionsFound };
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync_failed";
    logger.error("Gmail sync failed", { gmailConnectionId, message });

    // Only mark the connection as ERROR for authentication-related failures
    // (invalid_grant, invalid_token, 401). For transient failures we record
    // the lastError but keep the previous status so the UI does not remove
    // the connection unexpectedly.
    const isAuthError = /invalid_grant|invalid_token|401|invalid_credentials/i.test(message);

    const updateData: any = { lastErrorAt: new Date(), lastError: message };
    if (isAuthError) updateData.status = "ERROR";

    await prisma.gmailConnection.update({ where: { id: connection.id }, data: updateData });

    await prisma.gmailSyncLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: message, completedAt: new Date() }
    });

    throw error;
  }
}

export async function syncAllGmailConnections() {
  const connections = await prisma.gmailConnection.findMany({
    where: { status: "ACTIVE" },
    select: { id: true }
  });

  if (!queues) return { queued: 0 };

  try {
    for (const conn of connections) {
      await queues.gmailSync.add("sync", { gmailConnectionId: conn.id });
    }
    return { queued: connections.length };
  } catch (err) {
    logger.warn("Failed to queue gmail-sync jobs; Redis may be unreachable", { error: err instanceof Error ? err.message : String(err) });
    return { queued: 0 };
  }
}

function extractEmailBody(payload: { body?: { data?: string | null }; parts?: Array<{ mimeType?: string | null; body?: { data?: string | null }; parts?: unknown[] }> } | null | undefined): string {
  if (!payload) return "";

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }

  let htmlFallback = "";
  for (const part of payload.parts ?? []) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return Buffer.from(part.body.data, "base64").toString("utf8");
    }
    if (part.mimeType === "text/html" && part.body?.data) {
      htmlFallback = Buffer.from(part.body.data, "base64").toString("utf8");
    }
    if (part.parts) {
      const nested = extractEmailBody(part as typeof payload);
      if (nested) return nested;
    }
  }

  return htmlFallback;
}
