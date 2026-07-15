"use client";

import { useMemo, useState } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import apiFetch from "@/lib/api/client";
import type { ElementType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Layers3, Pencil, Search, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, DashboardCard } from "@/components/dashboard/card-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

type RoleSummary = {
  id: string;
  name: string;
  description?: string | null;
  permissions: Array<{ permission: { key: string } }>;
  _count?: { members: number };
};

type PermissionKey = string;

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");
  const debouncedPermissionSearch = useDebouncedValue(permissionSearch, 350);

  const { data: bootstrap } = useQuery({
    queryKey: ["admin-roles-bootstrap"],
    queryFn: async () => (await apiFetch("/api/admin/roles"))
  });

  const { data: rolesData } = useQuery({
    queryKey: ["admin-roles", organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => (await apiFetch(`/api/admin/roles?organizationId=${organizationId}`))
  });

  const organizations = useMemo<OrganizationSummary[]>(() => bootstrap?.organizations ?? [], [bootstrap?.organizations]);
  const roles = useMemo<RoleSummary[]>(() => rolesData?.roles ?? [], [rolesData?.roles]);
  const permissionCatalog = useMemo<PermissionKey[]>(
    () => rolesData?.permissionCatalog ?? bootstrap?.permissionCatalog ?? [],
    [bootstrap?.permissionCatalog, rolesData?.permissionCatalog]
  );

  const filteredPermissions = useMemo(() => {
    const needle = debouncedPermissionSearch.trim().toLowerCase();
    if (!needle) return permissionCatalog;
    return permissionCatalog.filter((permission) => permission.toLowerCase().includes(needle));
  }, [permissionCatalog, debouncedPermissionSearch]);

  const groupedPermissions = useMemo(() => {
    return filteredPermissions.reduce<Record<string, string[]>>((groups, permission) => {
      const group = permission.split(".")[0] ?? "platform";
      groups[group] = [...(groups[group] ?? []), permission];
      return groups;
    }, {});
  }, [filteredPermissions]);

  const stats = useMemo(() => {
    const assignedPermissions = new Set(roles.flatMap((role) => role.permissions.map((item) => item.permission.key)));
    const members = roles.reduce((total, role) => total + (role._count?.members ?? 0), 0);
    return {
      roles: roles.length,
      members,
      assignedPermissions: assignedPermissions.size,
      catalog: permissionCatalog.length
    };
  }, [permissionCatalog.length, roles]);

  const resetForm = () => {
    setEditingRoleId(null);
    setName("");
    setDescription("");
    setSelectedPermissions([]);
  };

  const createRole = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, name, description, permissionKeys: selectedPermissions }) });
    },
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-roles", organizationId] });
    }
  });

  const updateRole = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/admin/roles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roleId: editingRoleId, organizationId, name, description, permissionKeys: selectedPermissions }) });
    },
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-roles", organizationId] });
    }
  });

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => {
      return await apiFetch(`/api/admin/roles?roleId=${encodeURIComponent(roleId)}&organizationId=${encodeURIComponent(organizationId)}`, { method: "DELETE" });
    },
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-roles", organizationId] });
    }
  });

  const startEditing = (role: RoleSummary) => {
    setEditingRoleId(role.id);
    setName(role.name);
    setDescription(role.description ?? "");
    setSelectedPermissions(role.permissions.map((item) => item.permission.key));
  };

  const savePending = createRole.isPending || updateRole.isPending;
  const canSave = Boolean(organizationId && name && selectedPermissions.length && !savePending);

  return (
    <>
      <div className="space-y-6">
        <DashboardHeader title="RBAC Command Center" description="Create and manage database-driven custom roles across workspaces" />

        {/* Stats Grid */}
        <div>
          <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Overview</p>
          <DashboardGrid columns={4}>
            <StatCard icon={UsersRound} label="Custom roles" value={stats.roles.toLocaleString()} tone="text-cyan-200" />
            <StatCard icon={Layers3} label="Role members" value={stats.members.toLocaleString()} tone="text-emerald-200" />
            <StatCard icon={ShieldCheck} label="Assigned perms" value={stats.assignedPermissions.toLocaleString()} tone="text-violet-200" />
            <StatCard icon={KeyRound} label="Catalog perms" value={stats.catalog.toLocaleString()} tone="text-amber-200" />
          </DashboardGrid>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main Content - Roles List */}
          <div className="space-y-4">
            <DashboardCard title="Roles" subtitle="Workspace-scoped custom roles">
              <div className="mb-4 mb-4">
                <select
                  className="w-full h-8 rounded-dense border border-white/10 bg-black/20 px-3 text-sm text-zinc-200 outline-none focus:border-cyan-300/50"
                  value={organizationId}
                  onChange={(e) => {
                    setOrganizationId(e.target.value);
                    resetForm();
                  }}
                >
                  <option value="">Choose a workspace...</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name} ({organization.slug})
                    </option>
                  ))}
                </select>
              </div>

              {!organizationId ? (
                <div className="rounded-dense border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                  <p className="text-sm font-medium text-white">Select a workspace</p>
                  <p className="text-xs text-zinc-500 mt-1">Custom roles are scoped per workspace</p>
                </div>
              ) : roles.length ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {roles.map((role) => (
                    <div key={role.id} className="rounded-dense border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-white truncate">{role.name}</p>
                            {editingRoleId === role.id && (
                              <span className="rounded-dense border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-200 flex-shrink-0">
                                Editing
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 truncate mt-1">{role.description || "No description"}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => startEditing(role)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => deleteRole.mutate(role.id)}
                            disabled={deleteRole.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs text-zinc-500">
                        <span className="px-2 py-1 rounded-dense bg-white/[0.05] border border-white/10">
                          {role._count?.members ?? 0} members
                        </span>
                        <span className="px-2 py-1 rounded-dense bg-white/[0.05] border border-white/10">
                          {role.permissions.length} perms
                        </span>
                      </div>
                      {role.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 max-h-14 overflow-hidden">
                          {role.permissions.slice(0, 12).map((permission) => (
                            <span key={permission.permission.key} className="text-[10px] px-2 py-1 rounded-dense border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                              {permission.permission.key}
                            </span>
                          ))}
                          {role.permissions.length > 12 && (
                            <span className="text-[10px] px-2 py-1 rounded-dense border border-white/10 text-zinc-500">
                              +{role.permissions.length - 12}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-dense border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                  <p className="text-sm font-medium text-white">No custom roles yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Create a role to move beyond legacy access</p>
                </div>
              )}
            </DashboardCard>
          </div>

          {/* Sidebar - Form */}
          <div className="lg:sticky lg:top-24 h-fit">
            <DashboardCard title={editingRoleId ? "Edit role" : "New role"} subtitle={editingRoleId ? "Update permissions" : "Create role"}>
              <div className="space-y-3">
                <Input
                  placeholder="Role name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Short description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 text-sm"
                />

                <div className="rounded-dense border border-white/10 bg-white/[0.02] p-2">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-white">
                      {selectedPermissions.length} / {permissionCatalog.length}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      onClick={() => setSelectedPermissions(selectedPermissions.length === permissionCatalog.length ? [] : permissionCatalog)}
                      disabled={!permissionCatalog.length}
                    >
                      {selectedPermissions.length === permissionCatalog.length ? "Clear" : "All"}
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-600" />
                    <Input
                      className="pl-6 h-7 text-xs"
                      placeholder="Search..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                  {Object.entries(groupedPermissions).map(([group, permissions]) => (
                    <div key={group}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">
                        {group} <span className="text-zinc-600">({permissions.length})</span>
                      </p>
                      <div className="space-y-1">
                        {permissions.map((permission) => {
                          const active = selectedPermissions.includes(permission);
                          return (
                            <button
                              key={permission}
                              type="button"
                              className={`w-full flex items-center justify-between gap-2 rounded-dense border px-2 py-1 text-left text-xs transition-colors ${
                                active ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]"
                              }`}
                              onClick={() =>
                                setSelectedPermissions((current) =>
                                  current.includes(permission)
                                    ? current.filter((item) => item !== permission)
                                    : [...current, permission]
                                )
                              }
                            >
                              <span className="truncate text-[10px] font-mono">{permission}</span>
                              {active ? (
                                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                              ) : (
                                <span className="text-zinc-600 text-[10px]">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full rounded-dense bg-cyan-600 hover:bg-cyan-700 h-8 text-sm"
                  disabled={!canSave}
                  onClick={() => (editingRoleId ? updateRole.mutate() : createRole.mutate())}
                >
                  {savePending ? "Saving..." : editingRoleId ? "Update" : "Create"}
                </Button>

                {editingRoleId && (
                  <Button
                    variant="outline"
                    className="w-full rounded-dense h-8 text-sm"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: ElementType; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-dense bg-white/[0.05] ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
