import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/api/response";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { publicId: orderId },
    select: {
      publicId: true,
      amount: true,
      currency: true,
      status: true,
      submittedUtr: true,
      failureReason: true,
      createdAt: true,
      verifiedAt: true
    }
  });

  if (!order) {
    return apiError("order_not_found", "Order could not be found.", 404);
  }

  return apiOk(order);
}
