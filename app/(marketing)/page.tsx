"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
// Temporarily disable framer-motion animations to avoid content being hidden
// Replace `motion.div` with a no-op component that strips animation props.
const motion = {
  div: ({ children, initial, animate, whileInView, viewport, transition, ...rest }: any) => {
    return <div {...rest}>{children}</div>;
  }
};
import { HeroBlocks } from "@/components/marketing/hero-blocks";

const features = [
  "Gmail-powered UTR verification",
  "Signed webhooks with retries",
  "Multi-project API keys",
  "Tenant-isolated infrastructure"
];

const steps = [
  ["Customer pays via UPI", "Your customer completes payment using your UPI ID or QR code."],
  ["Customer submits UTR", "They enter their transaction reference on your Elyto checkout page."],
  ["Elyto verifies payment", "Gmail sync matches UTR, amount, and timing against bank notifications."],
  ["Webhook triggers fulfillment", "Your app receives a signed order.verified event and delivers instantly."]
];

const faqs = [
  ["Is Elyto a payment gateway?", "No. Elyto verifies payments and automates fulfillment — you keep your existing UPI flow."],
  ["Which banks are supported?", "Any UPI payment that sends email notifications to a connected Gmail account."],
  ["How fast is verification?", "Typically under 5 seconds after the payment email is received."]
];

export default function HomePage() {
  return (
    <>
      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 pb-24 pt-10">
        <HeroBlocks />
        <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="mb-5 text-sm font-medium text-secondary">Payment verification infrastructure for India</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white md:text-7xl">
              Automate UPI Payment Verification With Gmail
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Elyto verifies UPI payments directly from Gmail transaction emails and triggers webhooks instantly.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-violet-600">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link href="/api-docs" className="rounded-md border border-border px-5 py-3 text-sm font-medium text-zinc-100 hover:bg-white/5">
                View Documentation
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-4">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                  <CheckCircle2 size={14} className="text-secondary" /> {f}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="surface rounded-lg p-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="rounded-md border border-border bg-black p-4 font-mono text-sm text-zinc-300">
              <div className="text-secondary">order.verified</div>
              <pre className="mt-4 overflow-auto text-xs leading-6">{`{
  "event": "order.verified",
  "orderId": "ord_9Wk2...",
  "amount": 1299,
  "utr": "423819002184",
  "status": "verified"
}`}</pre>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-card/60 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-semibold text-white">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, body], i) => (
              <motion.div
                key={title}
                className="rounded-lg border border-border bg-background p-5"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-sm font-medium text-secondary">Step {i + 1}</span>
                <h3 className="mt-2 font-medium text-white">{title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-white">Ready to automate verification?</h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">Join sellers, SaaS founders, and server owners who ship faster with Elyto.</p>
          <Link href="/signup" className="mt-8 inline-flex rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-violet-600">
            Get started free
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-semibold text-white">FAQ</h2>
          <div className="mt-10 space-y-4">
            {faqs.map(([q, a]) => (
              <div key={q} className="rounded-lg border border-border bg-background p-5">
                <h3 className="font-medium text-white">{q}</h3>
                <p className="mt-2 text-sm text-zinc-400">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
