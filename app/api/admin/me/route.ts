import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/api/admin";

export async function GET(_request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, email, name, platformRole } = admin.user as any;
  return NextResponse.json({ user: { id, email, name, platformRole } });
}
