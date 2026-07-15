import { NextResponse } from "next/server";
import { availableProviders } from "@/lib/auth";

export async function GET() {
  return NextResponse.json(availableProviders);
}
