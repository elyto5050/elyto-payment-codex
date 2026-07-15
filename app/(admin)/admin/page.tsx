import Link from "next/link";
import { auth } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardCard } from "@/components/dashboard/card-components";
import { getPlatformMetrics } from "@/lib/services/analytics";
import { getTrustedPlatformOwnership, isPlatformOwnerUser } from "@/lib/platform-owner";

export default async function AdminPage() {
  const [metrics, ownership, session] = await Promise.all([getPlatformMetrics(), getTrustedPlatformOwnership(), auth()]);
  const isOwner = await isPlatformOwnerUser(session?.user?.id, session?.user?.email);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Platform Command Center"
        description="Growth, verification, security, and ownership across the platform"
      />

      {/* Metrics Grid */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Platform Metrics</p>
        <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-8">
          <div className="md:col-span-2 rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-zinc-500">Users</p>
            <p className="mt-2 text-lg font-semibold text-cyan-200">{metrics.users.toLocaleString()}</p>
          </div>
          <div className="md:col-span-2 rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-zinc-500">Projects</p>
            <p className="mt-2 text-lg font-semibold text-cyan-200">{metrics.projects.toLocaleString()}</p>
          </div>
          <div className="md:col-span-2 rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-zinc-500">Orders</p>
            <p className="mt-2 text-lg font-semibold text-cyan-200">{metrics.orders.toLocaleString()}</p>
          </div>
          <div className="md:col-span-2 rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-zinc-500">Paid Orders</p>
            <p className="mt-2 text-lg font-semibold text-emerald-200">{metrics.paidOrders.toLocaleString()}</p>
          </div>
          <div className="md:col-span-2 rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-zinc-500">Transactions</p>
            <p className="mt-2 text-lg font-semibold text-cyan-200">{metrics.transactions.toLocaleString()}</p>
          </div>
          <div className="md:col-span-2 rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-zinc-500">Gmail</p>
            <p className="mt-2 text-lg font-semibold text-cyan-200">{metrics.gmailConnections.toLocaleString()}</p>
          </div>
          <div className="md:col-span-2 rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-zinc-500">Verification</p>
            <p className={`mt-2 text-lg font-semibold ${metrics.verificationRate >= 85 ? "text-emerald-200" : "text-amber-200"}`}>{Math.round(metrics.verificationRate)}%</p>
          </div>
          <div className="md:col-span-2 rounded-dense border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-zinc-500">Owner</p>
            <p className={`mt-2 text-lg font-semibold ${isOwner ? "text-emerald-200" : "text-cyan-200"}`}>{isOwner ? "Active" : "Staff"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Ownership Card */}
          <DashboardCard title="Ownership Guardian" subtitle={isOwner ? "Owner session" : "Staff session"}>
            <div className="space-y-3 grid md:grid-cols-2 gap-3">
              <InfoTile label="Owner email" value={ownership.ownerEmail} />
              <InfoTile label="Transfer state" value={ownership.record?.transferRequestedForEmail ? "Pending" : "None"} />
              <InfoTile label="Transfer target" value={ownership.record?.transferRequestedForEmail ?? "None"} />
              <InfoTile label="Transfer expires" value={ownership.record?.transferExpiresAt ? new Date(ownership.record.transferExpiresAt).toLocaleDateString() : "None"} />
            </div>
          </DashboardCard>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 h-fit space-y-6">
          {/* Quick Actions */}
          <DashboardCard title="Controls">
            <div className="space-y-2">
              <ActionTile href="/admin/users" title="Users" />
              <ActionTile href="/admin/projects" title="Projects" />
              <ActionTile href="/admin/tickets" title="Support" />
              <ActionTile href="/admin/roles" title="Roles" />
            </div>
          </DashboardCard>

          {/* Owner Actions */}
          {isOwner && (
            <DashboardCard title="Owner Actions">
              <Link href="/transferowner" className="block w-full px-3 py-2 rounded-dense text-sm bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-400/20 text-center text-cyan-200 transition-colors">
                Transfer owner
              </Link>
            </DashboardCard>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white truncate">{value}</p>
    </div>
  );
}

function ActionTile({ href, title }: { href: string; title: string }) {
  return (
    <Link href={href} className="block rounded-dense border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-3 transition-colors">
      <p className="font-semibold text-sm text-white">{title}</p>
    </Link>
  );
}
