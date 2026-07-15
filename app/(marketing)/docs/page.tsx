import Link from "next/link";

const sections = [
  { title: "Quickstart", body: "Sign up, create a project, connect Gmail, and create your first order via API." },
  { title: "Create an order", body: "POST /api/v1/orders with your secret key to generate a checkout URL." },
  { title: "Submit a UTR", body: "Customers submit UTR on /pay/:orderId or via POST /api/v1/orders/:id/verify." },
  { title: "Webhooks", body: "Subscribe to order.verified events with HMAC signature verification." },
  { title: "Gmail setup", body: "Connect Gmail from the dashboard to enable automatic payment email parsing." }
];

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">Documentation</h1>
      <p className="mt-4 text-zinc-400">Guides to integrate Elyto into your product.</p>
      <div className="mt-10 space-y-4">
        {sections.map((s) => (
          <section key={s.title} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-medium text-white">{s.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{s.body}</p>
          </section>
        ))}
      </div>
      <Link href="/api-docs" className="mt-8 inline-block text-sm text-secondary hover:underline">
        View full API reference →
      </Link>
    </main>
  );
}
