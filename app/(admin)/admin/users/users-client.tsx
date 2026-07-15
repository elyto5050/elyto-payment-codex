"use client";

import { PlatformRole } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import apiFetch from "@/lib/api/client";
import { RotateCcw, Save, Shield, Trash2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  platformRole: PlatformRole;
  createdAt: string;
  deactivatedAt: string | null;
  deletedAt: string | null;
  isProtectedOwner: boolean;
  _count: {
    sessions: number;
    teamMemberships: number;
    loginHistory: number;
    securityEvents: number;
  };
};

type UsersPayload = {
  users: AdminUser[];
  platformRoles: PlatformRole[];
};

export default function AdminUsersClient() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Record<string, { name: string; platformRole: PlatformRole }>>({});

  const debouncedQuery = useDebouncedValue(query, 350);
  const [page, setPage] = useState(1);
  const pageSize = 100;

  type AdminUsersResponse = { data?: UsersPayload; meta?: { page?: number; totalPages?: number } };
  const { data, isLoading } = useQuery<AdminUsersResponse>({
    queryKey: ["admin-users", page, pageSize],
    queryFn: async () => (await apiFetch(`/api/admin/users?page=${page}&pageSize=${pageSize}`)) as AdminUsersResponse,
    staleTime: 15000,
    retry: 1
  });

  const action = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      return await apiFetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  const users = useMemo<AdminUser[]>(() => data?.data?.users ?? [], [data?.data?.users]);
  const filteredUsers = useMemo<AdminUser[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user: AdminUser) => user.email.toLowerCase().includes(q) || user.name?.toLowerCase().includes(q));
  }, [debouncedQuery, users]);

  const activeUsers = users.filter((user: AdminUser) => !user.deactivatedAt && !user.deletedAt).length;
  const protectedUsers = users.filter((user: AdminUser) => user.isProtectedOwner).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Owner controls</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Users</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Manage platform access, staff roles, account suspension, and soft deletion. Protected owner accounts are immutable here.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right">
            <Metric label="Total" value={users.length} />
            <Metric label="Active" value={activeUsers} />
            <Metric label="Protected" value={protectedUsers} />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Platform users</CardTitle>
            <div className="flex items-center gap-2">
              <Input className="md:max-w-sm" placeholder="Search by name or email" value={query} onChange={(event) => setQuery(event.target.value)} />
              <div className="text-xs text-zinc-400">Page {data?.meta?.page ?? page} / {data?.meta?.totalPages ?? "?"}</div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page >= (data?.meta?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-zinc-500">Loading users...</div>
          ) : filteredUsers.length ? (
            <div className="divide-y divide-border">
              {filteredUsers.map((user) => {
                const draft = editing[user.id] ?? { name: user.name ?? "", platformRole: user.platformRole };
                const disabled = user.isProtectedOwner || action.isPending;

                return (
                  <div key={user.id} className="grid gap-4 p-5 xl:grid-cols-[1.15fr_0.85fr_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-medium text-white">{user.name || "Unnamed user"}</p>
                        {user.isProtectedOwner ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                            <Shield className="h-3 w-3" /> Protected owner
                          </span>
                        ) : null}
                        {user.deletedAt ? (
                          <StatusBadge tone="danger">Deleted</StatusBadge>
                        ) : user.deactivatedAt ? (
                          <StatusBadge tone="warning">Suspended</StatusBadge>
                        ) : (
                          <StatusBadge tone="success">Active</StatusBadge>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-zinc-400">{user.email}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()} · {user._count.sessions} sessions · {user._count.teamMemberships} workspaces
                      </p>
                    </div>

                    <div className="grid gap-2 md:grid-cols-[1fr_160px]">
                      <Input
                        value={draft.name}
                        disabled={disabled}
                        placeholder="Display name"
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            [user.id]: { ...draft, name: event.target.value }
                          }))
                        }
                      />
                      <select
                        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                        value={draft.platformRole}
                        disabled={disabled}
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            [user.id]: { ...draft, platformRole: event.target.value as PlatformRole }
                          }))
                        }
                      >
                        {(data?.data?.platformRoles ?? []).map((role: PlatformRole) => (
                          <option key={role} value={role}>
                            {role.toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={disabled}
                        onClick={() => action.mutate({ action: "update", userId: user.id, name: draft.name || null, platformRole: draft.platformRole })}
                      >
                        <Save className="mr-1.5 h-3.5 w-3.5" /> Save
                      </Button>
                      {user.deactivatedAt || user.deletedAt ? (
                        <Button size="sm" variant="outline" disabled={disabled} onClick={() => action.mutate({ action: "restore", userId: user.id })}>
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled={disabled} onClick={() => action.mutate({ action: "suspend", userId: user.id })}>
                          <UserX className="mr-1.5 h-3.5 w-3.5" /> Suspend
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" disabled={disabled || Boolean(user.deletedAt)} onClick={() => action.mutate({ action: "delete", userId: user.id })}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-zinc-500">No users match this search.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ children, tone }: { children: React.ReactNode; tone: "success" | "warning" | "danger" }) {
  const styles = {
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/20 bg-rose-400/10 text-rose-200"
  };

  return <span className={`rounded-full border px-2.5 py-1 text-xs ${styles[tone]}`}>{children}</span>;
}
