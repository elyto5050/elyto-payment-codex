import QRCode from "qrcode";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { CheckoutForm } from "@/components/checkout-form";
import { formatCurrency } from "@/lib/utils";

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { publicId: orderId },
    include: {
      product: { select: { name: true, description: true } },
      project: { select: { name: true, upiId: true } }
    }
  });

  if (!order) notFound();

  const upiId = order.project.upiId ?? "merchant@upi";
  const amount = Number(order.amount);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(order.project.name)}&am=${amount}&cu=INR&tn=${orderId}`;
  const qr = await QRCode.toDataURL(upiUrl);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-secondary">Secure checkout</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {order.product?.name ?? "Complete your payment"}
        </h1>
        {order.product?.description ? (
          <p className="mt-2 text-sm text-zinc-400">{order.product.description}</p>
        ) : null}

        <Image src={qr} alt="UPI QR code" width={224} height={224} unoptimized className="mx-auto mt-6 rounded-md bg-white p-3" />

        <div className="mt-6 space-y-2 rounded-md border border-border bg-background p-4 text-sm text-zinc-300">
          <div className="flex justify-between"><span>Order</span><span className="font-mono text-xs">{orderId}</span></div>
          <div className="flex justify-between"><span>Amount</span><span>{formatCurrency(amount, order.currency)}</span></div>
          <div className="flex justify-between"><span>UPI ID</span><span>{upiId}</span></div>
          <div className="flex justify-between"><span>Status</span><span className="capitalize text-secondary">{order.status.toLowerCase()}</span></div>
        </div>

        <CheckoutForm orderId={orderId} initialStatus={order.status} />

        <p className="mt-6 text-center text-xs text-zinc-500">
          Pay via UPI, then submit your UTR to verify instantly.
        </p>
      </section>
    </main>
  );
}
