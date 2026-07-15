export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">About Elyto</h1>
      <p className="mt-6 text-lg leading-8 text-zinc-300">
        Elyto is the infrastructure layer for UPI payment verification and order fulfillment automation in India.
      </p>
      <p className="mt-4 leading-7 text-zinc-400">
        We built Elyto so Minecraft server owners, Discord bot developers, SaaS founders, and digital sellers
        never have to manually check payments again. Connect Gmail, verify UTRs automatically, and trigger
        webhooks to deliver products instantly.
      </p>
      <p className="mt-4 leading-7 text-zinc-400">
        Our mission is simple: every product built by our company should integrate with Elyto rather than
        implementing payment verification independently.
      </p>
    </main>
  );
}
