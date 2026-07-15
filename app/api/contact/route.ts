import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { bootstrapOrganization } from "@/lib/services/organization";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000)
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = await checkRateLimit(`contact:${ip}`, 5, 300_000);
  if (!rateLimit.allowed) return apiError("rate_limited", "Too many requests.", 429);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("invalid_request", "Invalid request.", 422);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  let organizationId: string | null = null;

  if (user) {
    const org = await prisma.teamMember.findFirst({ where: { userId: user.id } });
    organizationId = org?.organizationId ?? null;
    if (!organizationId) {
      const org = await bootstrapOrganization(user.id, parsed.data.name, parsed.data.email);
      organizationId = org.id;
    }
  } else {
    const inbound = await prisma.organization.findFirst({ where: { slug: "elyto-inbound" } });
    if (inbound) {
      organizationId = inbound.id;
    } else {
      const guest = await prisma.user.create({ data: { email: parsed.data.email, name: parsed.data.name } });
      const org = await bootstrapOrganization(guest.id, parsed.data.name, parsed.data.email);
      organizationId = org.id;
    }
  }

  await prisma.supportTicket.create({
    data: {
      organizationId,
      subject: `[Contact] ${parsed.data.subject}`,
      status: "OPEN",
      messages: {
        create: {
          body: `From: ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
          authorId: user?.id
        }
      }
    }
  });

  return apiOk({ success: true });
}
