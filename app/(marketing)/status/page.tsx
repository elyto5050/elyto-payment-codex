const services = [
  { name: "API", status: "operational" },
  { name: "Dashboard", status: "operational" },
  { name: "Gmail Sync", status: "operational" },
  { name: "Webhooks", status: "operational" },
  { name: "Checkout Pages", status: "operational" }
];

export default function StatusPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">System Status</h1>
      <p className="mt-4 text-zinc-400">All systems operational.</p>
      <div className="mt-10 space-y-3">
        {services.map((s) => (
          <div key={s.name} className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4">
            <span className="text-white">{s.name}</span>
            <span className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Operational
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
