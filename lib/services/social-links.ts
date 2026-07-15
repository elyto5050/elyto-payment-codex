import { prisma } from "@/lib/db/prisma";

export async function getSocialLinks() {
  try {
    return await prisma.socialLinks.findUnique({ where: { id: "platform" } });
  } catch (err) {
    return null;
  }
}

export async function upsertSocialLinks({ instagramUrl, youtubeUrl, discordInviteUrl, updatedById }: { instagramUrl?: string; youtubeUrl?: string; discordInviteUrl?: string; updatedById?: string }) {
  return prisma.socialLinks.upsert({
    where: { id: "platform" },
    create: { id: "platform", instagramUrl, youtubeUrl, discordInviteUrl, updatedById },
    update: { instagramUrl, youtubeUrl, discordInviteUrl, updatedById }
  });
}
