import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session || !session.user || !session.user.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, image: true, company: true, bio: true } });
  return NextResponse.json({ data: user });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession(request);
  if (!session || !session.user || !session.user.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  type ProfilePatch = { name?: string; company?: string; image?: string; bio?: string };
  const { name, company, image, bio } = (body as ProfilePatch) ?? {};

  try {
    const updated = await prisma.user.update({ where: { id: session.user.id }, data: { name: name ?? undefined, company: company ?? undefined, image: image ?? undefined, bio: bio ?? undefined } });
    return NextResponse.json({ data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
