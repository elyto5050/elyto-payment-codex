import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { sendWelcomeEmail } from "@/lib/email/send";

// Verify secret is configured for session encryption
const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (!secret) {
  console.warn(
    "⚠️  WARNING: No AUTH_SECRET or NEXTAUTH_SECRET configured. Auth.js will not be able to encrypt/decrypt session tokens."
  );
}
if (secret) {
  console.log("✓ Auth.js secret configured (length:", secret.length, ")");
}

export const availableProviders = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  resend: Boolean(process.env.RESEND_API_KEY)
};

// Lazy-initialize NextAuth configuration per-request to avoid importing Prisma
// at module load time (which can accidentally bundle Prisma into edge/middleware).
export const { handlers, auth, signIn, signOut } = NextAuth(async (req) => {
  // Initialize adapter only in non-edge runtimes
  let adapter: any = undefined;
  const isEdge = process.env.NEXT_RUNTIME === "edge";
  if (!isEdge) {
    try {
      const { PrismaAdapter } = await import("@auth/prisma-adapter");
      const { prisma } = await import("@/lib/db/prisma");
      adapter = PrismaAdapter(prisma);
    } catch (err) {
      console.warn("Prisma adapter not initialized:", (err as any)?.message || err);
      adapter = undefined;
    }
  }

  const providers: any[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      })
    );
  }

  // Enable Resend/email provider when an API key exists.
  // Historically the email provider was enabled as long as the API key was present;
  // restore that behavior so login UI shows the magic-link option when configured.
  if (process.env.RESEND_API_KEY) {
    try {
      providers.push(
        Resend({
          apiKey: process.env.RESEND_API_KEY,
          from: process.env.RESEND_FROM_EMAIL ?? "Elyto <hello@elyto.in>"
        })
      );
    } catch (err) {
      console.warn("Failed to register Resend provider:", (err as any)?.message || err);
    }
  }

  return {
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    adapter: adapter as any,
    providers,
    session: { strategy: "jwt" },
    callbacks: {
      async jwt({ token, user }) {
        console.log(`[AUTH][${new Date().toISOString()}] jwt callback input`, { userId: user?.id, tokenOrgId: token.organizationId });

        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = (user as any).name ?? token.name;
          token.picture = (user as any).image ?? token.picture;

          if ((user as any).platformRole) token.platformRole = (user as any).platformRole;
          if (typeof (user as any).onboardingCompleted !== "undefined") token.onboardingCompleted = (user as any).onboardingCompleted ?? false;

          // Enrich token with org + role data at sign-in (server runtime)
          try {
            const { prisma: dynPrisma } = await import("@/lib/db/prisma");
            const org = await dynPrisma.teamMember.findFirst({
              where: { userId: user.id },
              select: { organizationId: true },
              orderBy: { createdAt: "asc" }
            });
            if (org?.organizationId) token.organizationId = org.organizationId;

            const dbUser = await dynPrisma.user.findUnique({
              where: { id: user.id },
              select: { platformRole: true, onboardingCompleted: true }
            });
            if (dbUser) {
              token.platformRole = token.platformRole ?? dbUser.platformRole;
              token.onboardingCompleted = token.onboardingCompleted ?? dbUser.onboardingCompleted ?? false;
            }
            console.log(`[AUTH][${new Date().toISOString()}] jwt callback - enriched token for sign-in; org:`, token.organizationId);
          } catch (err: any) {
            console.warn(`[AUTH][${new Date().toISOString()}] jwt callback - DB enrichment skipped:`, err?.message || err);
          }
        }

        console.log(`[AUTH][${new Date().toISOString()}] jwt callback - returning token.organizationId:`, token.organizationId);
        return token as any;
      },
      async session({ session, token }) {
        console.log(`[AUTH][${new Date().toISOString()}] session callback input`, {
          tokenOrgId: token.organizationId,
          sessionOrgId: session.user?.organizationId,
          tokenId: token.id
        });

        if (session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string | undefined;
          session.user.name = (token as any).name as string | undefined;
          (session.user as any).image = (token as any).picture as string | undefined;
          session.user.platformRole = token.platformRole as (import("@prisma/client").PlatformRole | undefined);
          session.user.organizationId = token.organizationId as (string | undefined);
          (session.user as any).onboardingCompleted = (token as any).onboardingCompleted ?? false;
        }

        console.log(`[AUTH][${new Date().toISOString()}] session callback - returning session.user.organizationId:`, session.user?.organizationId);
        return session;
      }
    },
    events: {
      async createUser({ user }) {
        console.log(`[AUTH][${new Date().toISOString()}] event createUser for userId: ${user?.id}`);
        if (user.id) {
          try {
            const { bootstrapOrganization } = await import("@/lib/services/organization");
            await bootstrapOrganization(user.id, user.name, user.email);
          } catch (err) {
            console.warn("Failed to bootstrap organization:", (err as any)?.message || err);
          }

          try {
            const { initializeBillingRecord } = await import("@/lib/billing/service");
            await initializeBillingRecord(user.id, user.email ?? "");
          } catch (err) {
            console.warn("Failed to initialize billing for new user:", (err as any)?.message || err);
          }

          if (user.email) {
            await sendWelcomeEmail(user.email, user.name);
          }
        }
      },
      async signIn({ user, account }) {
        console.log(`[AUTH][${new Date().toISOString()}] event signIn for userId: ${user?.id} provider: ${account?.provider}`);
        if (user.id) {
          try {
            const { bootstrapOrganization } = await import("@/lib/services/organization");
            await bootstrapOrganization(user.id, user.name, user.email);
          } catch (err) {
            console.warn("Failed to bootstrap organization on signIn:", (err as any)?.message || err);
          }

          try {
            const { prisma: dynPrisma } = await import("@/lib/db/prisma");
            await dynPrisma.loginHistory.create({
              data: {
                userId: user.id,
                success: true,
                reason: account?.provider ?? "unknown"
              }
            });
          } catch (err) {
            console.warn("Failed to persist login history:", (err as any)?.message || err);
          }
        }
      }
    },
    pages: {
      signIn: "/login",
      verifyRequest: "/verify-request",
      error: "/login"
    }
  };
});
