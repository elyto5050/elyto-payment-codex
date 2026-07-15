import { MailCheck, Webhook, ShieldCheck, Code2, Zap, Users } from "lucide-react";

const features = [
  { icon: MailCheck, title: "Gmail sync", desc: "Securely connect Gmail and parse UPI payment notification emails into structured transactions." },
  { icon: Zap, title: "Instant verification", desc: "Match UTR, amount, timing, and duplicate usage before marking orders as paid." },
  { icon: Webhook, title: "Signed webhooks", desc: "HMAC-signed events with automatic retries and delivery logs." },
  { icon: Code2, title: "Developer API", desc: "REST API to create orders, check status, and integrate with any stack." },
  { icon: ShieldCheck, title: "Security first", desc: "Encrypted tokens, hashed API keys, tenant isolation, and audit logs." },
  { icon: Users, title: "Team workspaces", desc: "Invite team members with role-based access control." }
];

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">Features</h1>
      <p className="mt-4 max-w-2xl text-zinc-400">Everything you need to verify UPI payments and automate fulfillment.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-border bg-card p-6">
            <Icon className="text-secondary" size={24} />
            <h2 className="mt-4 font-medium text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
