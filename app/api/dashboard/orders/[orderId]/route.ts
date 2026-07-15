import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await requireSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId } = await params;
    const order = await prisma.order.findUnique({
      where: { publicId: orderId },
      include: {
        product: { select: { name: true } },
        project: { include: { organization: true } }
      }
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const org = order.project.organization;
    const userOrg = await prisma.organization.findFirst({
      where: { id: org.id, members: { some: { userId: session.user.id } } }
    });
    if (!userOrg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({
      success: true,
      data: {
        publicId: order.publicId,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        submittedUtr: order.submittedUtr,
        failureReason: order.failureReason,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        verifiedAt: order.verifiedAt,
        failedAt: order.failedAt,
        expiresAt: order.expiresAt,
        product: order.product?.name ?? "-",
        project: order.project.name
      }
    });
  } catch (err) {
    console.error("Order detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
