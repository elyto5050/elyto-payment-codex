import { FolderKanban, Package, ReceiptText, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    include: { organization: { select: { name: true, slug: true } }, _count: { select: { orders: true, products: true, transactions: true } } },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const active = projects.filter((project) => project.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Platform inventory</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Projects</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">All active platform projects, organization ownership, order volume, and operational status.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<FolderKanban className="h-4 w-4" />} label="Projects" value={projects.length} />
        <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Active" value={active} />
        <Metric icon={<Package className="h-4 w-4" />} label="Products" value={projects.reduce((sum, project) => sum + project._count.products, 0)} />
        <Metric icon={<ReceiptText className="h-4 w-4" />} label="Orders" value={projects.reduce((sum, project) => sum + project._count.orders, 0)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">{project.name}</p>
                  <p className="mt-1 truncate text-xs text-zinc-500">{project.organization.name} · {project.organization.slug}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs ${project.status === "ACTIVE" ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}`}>
                  {project.status.toLowerCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Mini label="Orders" value={project._count.orders} />
                <Mini label="Products" value={project._count.products} />
                <Mini label="Transactions" value={project._count.transactions} />
              </div>
              <p className="text-xs text-zinc-500">Created {project.createdAt.toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{icon}</span>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
          <p className="mt-1 text-sm font-medium text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
