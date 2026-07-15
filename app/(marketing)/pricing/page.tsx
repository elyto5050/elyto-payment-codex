import Link from "next/link";
import { PLANS } from "@/lib/plans";

const featured = ["PREMIUM_1", "PREMIUM_2", "PREMIUM_3"] as const;

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">Pricing</h1>
      <p className="mt-4 text-zinc-400">Usage-based plans built around verified orders and webhook volume.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {featured.map((key) => {
          const plan = (PLANS as any)[key];
          return (
            <section key={key} className={`rounded-lg border p-6 ${key === "PREMIUM_2" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <h2 className="text-xl font-medium text-white">{plan.name}</h2>
              <p className="mt-4 text-3xl font-semibold text-white">₹{plan.price}<span className="text-sm font-normal text-zinc-500">/mo</span></p>
              <p className="mt-2 text-sm text-zinc-400">{plan.maxVerifications === -1 ? "Unlimited verifications" : `${plan.maxVerifications} verifications/mo`}</p>
              <ul className="mt-6 space-y-2 text-sm text-zinc-300">
                <li>✓ {plan.maxProjects === -1 ? "Unlimited projects" : `${plan.maxProjects} projects`}</li>
                <li>✓ Gmail sync</li>
                <li>✓ Webhooks</li>
                <li>✓ API access</li>
              </ul>
              <Link href="/signup" className="mt-6 block rounded-md bg-primary py-2 text-center text-sm font-medium text-white hover:bg-violet-600">
                Get started
              </Link>
            </section>
          );
        })}
      </div>
    </main>
  );
}
