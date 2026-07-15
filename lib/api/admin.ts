import { PlatformRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isPlatformOwnerUser } from "@/lib/platform-owner";

export async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, platformRole: true, email: true, name: true }
  });

  if (!user) {
    return null;
  }

  if (user.platformRole !== PlatformRole.ADMIN && user.platformRole !== PlatformRole.SUPPORT) {
    const isOwner = await isPlatformOwnerUser(user.id, user.email);
    if (!isOwner) {
      return null;
    }
  }

  return { session, user };
}

export async function requirePlatformOwner() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const allowed = await isPlatformOwnerUser(session.user.id, session.user.email);
  if (!allowed) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, platformRole: true, email: true, name: true }
  });

  if (!user) return null;

  return { session, user };
}
