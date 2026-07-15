import OrderDetailClient from "@/components/dashboard/order-detail-client";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolved = await params;
  const { orderId } = resolved;
  return <OrderDetailClient orderId={orderId} />;
}
