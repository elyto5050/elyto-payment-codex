/**
 * Billing API Endpoints
 * Routes for managing subscriptions, quotas, and billing information
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBillingInfo, upgradePlan, adjustVerificationCount } from "@/lib/billing/service";
import { 
  createSubscriptionPayment, 
  getSubscriptionPaymentHistory 
} from "@/lib/billing/self-billing";
import { hasPermission } from "@/lib/rbac/service";
import type { BillingPlan } from "@/lib/billing/service";
import { PLANS } from "@/lib/plans";

/**
 * GET /api/billing/info
 * Get user's billing information and quota status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billingInfo = await getBillingInfo(session.user.id);
    
    if (!billingInfo) {
      return NextResponse.json({ error: "Billing record not found" }, { status: 404 });
    }

    return NextResponse.json({ billing: billingInfo });
  } catch (error) {
    console.error("Failed to get billing info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/billing/upgrade
 * Initiate subscription upgrade
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan) {
      return NextResponse.json({ error: "Plan required" }, { status: 400 });
    }

    // Create subscription payment request
    const payment = await createSubscriptionPayment(
      session.user.id,
      session.user.email || "",
      plan as BillingPlan,
      getPlanPrice(plan)
    );

    return NextResponse.json({ payment });
  } catch (error: unknown) {
    console.error("Failed to initiate upgrade:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}

// Note: Additional billing endpoints (can-verify, payment-history) moved to dedicated route files

// Admin quota adjustment moved to admin route:
// app/api/admin/billing/user/[userId]/quota/route.ts
function getPlanPrice(plan: BillingPlan): number {
  return (PLANS as any)[plan]?.price ?? 0;
}
