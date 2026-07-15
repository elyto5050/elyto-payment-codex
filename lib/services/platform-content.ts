import { prisma } from "@/lib/db/prisma";

export async function getPlatformContent(slug: string) {
  try {
    return await prisma.platformContent.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

export async function upsertPlatformContent(slug: string, title: string, content: string, updatedById?: string) {
  return prisma.platformContent.upsert({
    where: { slug },
    create: { slug, title, content, updatedById },
    update: { title, content, updatedById }
  });
}

export async function listPlatformContent() {
  return prisma.platformContent.findMany({ orderBy: { slug: "asc" } });
}

export const DEFAULT_LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: "Terms of Service",
    content: `## Terms of Service

By using Elyto, you agree to these terms.

### Service
Elyto provides payment verification and automation infrastructure. We are not a payment gateway.

### Accounts
You are responsible for securing your account and API keys.

### Acceptable Use
Do not use Elyto for fraud, money laundering, or illegal activity.

### Liability
Elyto is provided as-is. We are not liable for payment disputes between you and your customers.

Contact: hello@elyto.in`
  },
  refund: {
    title: "Refund Policy",
    content: `## Refund Policy

### Subscriptions
Refunds for unused subscription time may be requested within 7 days of purchase.

### Verification Credits
Used verification credits are non-refundable.

### How to Request
Email hello@elyto.in with your account email and reason for the refund request.

We aim to respond within 3 business days.`
  },
  privacy: {
    title: "Privacy Policy",
    content: `## Privacy Policy

We collect account information, usage data, and Gmail metadata required for payment verification.

We never sell your data. Gmail email contents are encrypted and never exposed publicly.

Contact: hello@elyto.in`
  }
};
