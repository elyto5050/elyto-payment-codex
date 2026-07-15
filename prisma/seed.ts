import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_LEGAL_CONTENT, upsertPlatformContent } from "@/lib/services/platform-content";
import { upsertPost } from "@/lib/services/blog";

async function main() {
  for (const [slug, { title, content }] of Object.entries(DEFAULT_LEGAL_CONTENT)) {
    await upsertPlatformContent(slug, title, content);
  }

  try {
    await upsertPost({
      slug: "introducing-elyto",
      title: "Introducing Elyto",
      excerpt: "Payment verification infrastructure for Indian businesses.",
      content: "Elyto automates UPI payment verification using Gmail transaction notifications.\n\nConnect Gmail, create a project, and start verifying payments in minutes.",
      published: true
    });
    await upsertPost({
      slug: "how-utr-verification-works",
      title: "How UTR Verification Works",
      excerpt: "A deep dive into Gmail sync and the verification engine.",
      content: "When a customer submits a UTR, Elyto matches it against parsed Gmail transactions.\n\nChecks include: UTR match, amount match, time window, duplicate detection.",
      published: true
    });
  } catch {
    // BlogPost table may not exist yet
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (adminEmail) {
    const updated = await prisma.user.updateMany({
      where: { email: adminEmail },
      data: { platformRole: PlatformRole.ADMIN }
    });
    if (updated.count > 0) {
      console.log(`Admin role set for ${adminEmail}`);
    }
  }

  console.log("Seed complete: legal pages initialized.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
