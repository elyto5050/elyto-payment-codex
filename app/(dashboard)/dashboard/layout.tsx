import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  try {
    console.log('[DASHBOARD LAYOUT] session.user=', session?.user ? JSON.stringify(session.user) : 'null');
  } catch (err) {
    console.log('[DASHBOARD LAYOUT] session.user= <unserializable>');
  }

  // Prefer authoritative value from the database in case the session JWT
  // hasn't been refreshed yet after onboarding completion.
  let onboardingCompleted = (session?.user as any)?.onboardingCompleted;
  try {
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { onboardingCompleted: true } });
      if (typeof dbUser?.onboardingCompleted !== 'undefined') onboardingCompleted = dbUser?.onboardingCompleted;
    }
  } catch (err) {
    console.warn('[DASHBOARD LAYOUT] failed to read onboarding state from DB', err);
  }

  console.log('[DASHBOARD LAYOUT] onboardingCompleted=', typeof onboardingCompleted === 'undefined' ? 'missing' : onboardingCompleted);

  if (!session) {
    console.log('[DASHBOARD LAYOUT] redirecting to /login (no session)');
    redirect('/login');
  }

  if (session && onboardingCompleted === false) {
    console.log('[DASHBOARD LAYOUT] redirecting to /onboarding (onboarding incomplete)');
    redirect('/onboarding');
  }

  console.log('[DASHBOARD LAYOUT] rendering dashboard');
  return <>{children}</>;
}
