import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? null;
  let cookies: unknown[] = [];
  try {
    cookies = typeof request.cookies?.getAll === "function" ? request.cookies.getAll() : [];
  } catch (e) {
    cookies = [`error: ${String(e)}`];
  }

  let authWithoutRequest: unknown = null;
  try {
    // auth() should be called without request in Next.js 15 App Router
    authWithoutRequest = await auth();
  } catch (err) {
    authWithoutRequest = { error: String(err) };
  }

  const nextAuthSecret = process.env.NEXTAUTH_SECRET ? "present" : "missing";
  const authSecret = process.env.AUTH_SECRET ? "present" : "missing";

  return NextResponse.json({
    cookieHeader,
    cookies,
    authWithoutRequest,
    nextAuthSecret,
    authSecret
  });
}
