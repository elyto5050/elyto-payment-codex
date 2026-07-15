import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSubscriptionPaymentHistory } from "@/lib/billing/self-billing";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await getSubscriptionPaymentHistory(session.user.id);
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Failed to get payment history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
