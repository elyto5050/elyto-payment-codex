import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canVerifyPayment, getRemainingVerifications } from "@/lib/billing/service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canVerify = await canVerifyPayment(session.user.id);
    const remaining = await getRemainingVerifications(session.user.id);

    return NextResponse.json({
      canVerify,
      remainingVerifications: remaining,
    });
  } catch (error) {
    console.error("Failed to check verification eligibility:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
