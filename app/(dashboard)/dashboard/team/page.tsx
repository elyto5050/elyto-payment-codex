"use client";

import { useMemo, useState } from "react";
import apiFetch from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MailPlus, Shield, UserRound, Users, Clock3, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TeamMember = {
  id: string;
  role: string;
  createdAt?: string;
  user: { name?: string | null; email: string };
};

type TeamInvite = {
  id: string;
  email: string;
  role: string;
  expiresAt?: string;
  createdAt?: string;
};

type TeamPayload = {
  members: TeamMember[];
  invites: TeamInvite[];
};

const ROLE_COPY: Record<string, string> = {
  OWNER: "Full workspace ownership and billing control.",
  ADMIN: "Manage team, settings, projects, and integrations.",
  MANAGER: "Operate projects, products, orders, Gmail, and webhooks.",
  VIEWER: "Read-only access for reporting and support."
};

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("VIEWER");

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => (await apiFetch("/api/dashboard/team")) as TeamPayload
  });

  const members = useMemo(() => data?.members ?? [], [data?.members]);
  const invites = useMemo(() => data?.invites ?? [], [data?.invites]);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/dashboard/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role })
      });
    },
    onSuccess: () => {
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["team"] });
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Workspace</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Team</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Invite operators, assign roles, review pending access, and keep workspace permissions clear.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 xl:min-w-[460px]">
            <Metric label="Members" value={members.length} />
            <Metric label="Pending" value={invites.length} />
            <Metric label="Admins" value={members.filter((member) => member.role === "ADMIN" || member.role === "OWNER").length} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="border-b border-border">
            <div>
              <CardTitle>Members</CardTitle>
              <p className="mt-1 text-sm text-zinc-500">Workspace users and pending invitations.</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {members.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
                {invites.map((invite) => (
                  <InviteRow key={invite.id} invite={invite} />
                ))}
                {!members.length && !invites.length ? (
                  <div className="p-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-zinc-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-white">No team members yet</p>
                    <p className="mt-2 text-sm text-zinc-500">Invite your first teammate to collaborate.</p>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <MailPlus className="h-4 w-4" /> Invite member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <FormLabel label="Email">
                <Input type="email" placeholder="email@company.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              </FormLabel>
              <FormLabel label="Role">
                <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-zinc-300" value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="VIEWER">Viewer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </FormLabel>
              <Button className="w-full" disabled={!email || inviteMutation.isPending} onClick={() => inviteMutation.mutate()}>
                {inviteMutation.isPending ? "Sending..." : "Send invite"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Role guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {Object.entries(ROLE_COPY).map(([roleName, copy]) => (
                <div key={roleName} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-sm font-medium text-white">{roleName.toLowerCase()}</p>
                  <p className="mt-1 text-sm text-zinc-500">{copy}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  const owner = member.role === "OWNER";
  return (
    <div className="grid gap-4 p-5 transition-colors hover:bg-white/[0.025] md:grid-cols-[1fr_180px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${owner ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"}`}>
          {owner ? <Crown className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{member.user.name ?? member.user.email}</p>
          <p className="mt-1 truncate text-xs text-zinc-500">{member.user.email}</p>
        </div>
      </div>
      <div className="md:text-right">
        <RoleBadge role={member.role} />
        <p className="mt-2 text-xs text-zinc-500">{member.createdAt ? `Joined ${new Date(member.createdAt).toLocaleDateString()}` : "Active member"}</p>
      </div>
    </div>
  );
}

function InviteRow({ invite }: { invite: TeamInvite }) {
  return (
    <div className="grid gap-4 p-5 opacity-75 transition-colors hover:bg-white/[0.025] md:grid-cols-[1fr_180px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-400">
          <Clock3 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{invite.email}</p>
          <p className="mt-1 text-xs text-zinc-500">Pending invitation</p>
        </div>
      </div>
      <div className="md:text-right">
        <RoleBadge role={invite.role} />
        <p className="mt-2 text-xs text-zinc-500">{invite.expiresAt ? `Expires ${new Date(invite.expiresAt).toLocaleDateString()}` : "Invite sent"}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-200">
      <Shield className="h-3.5 w-3.5 text-cyan-200" />
      {role.toLowerCase()}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function FormLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
