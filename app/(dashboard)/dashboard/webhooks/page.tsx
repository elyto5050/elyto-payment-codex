"use client";

import { useMemo, useState } from "react";
import apiFetch from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, RotateCw, AlertTriangle, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, StatCard, DashboardCard } from "@/components/dashboard/card-components";
import { useToast } from "@/components/ui/toast-context";

type Project = { id: string; name: string };
type WebhookEndpoint = {
  id: string;
  name: string;
  url: string;
  status: string;
  events?: string[];
  project: { name: string };
  _count: { deliveries: number };
};
type WebhookHealth = {
  id: string;
  name: string;
  healthy: boolean;
  successRate: number;
  lastDelivery?: { status?: string; at?: string; error?: string } | null;
};

const EVENT_OPTIONS = ["order.created", "order.utr_submitted", "order.verified", "order.failed"];

export default function WebhooksPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ projectId: "", name: "", url: "", events: EVENT_OPTIONS });
  const [secret, setSecret] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; success: boolean } | null>(null);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await apiFetch("/api/dashboard/projects")) as Project[]
  });

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => (await apiFetch("/api/dashboard/webhooks")) as WebhookEndpoint[]
  });

  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ["webhook-health"],
    queryFn: async () => (await apiFetch("/api/dashboard/webhooks/health")) as WebhookHealth[]
  });

  const healthById = useMemo(() => new Map((health ?? []).map((item) => [item.id, item])), [health]);
  const endpoints = webhooks ?? [];
  const healthy = (health ?? []).filter((item) => item.healthy).length;
  const avgSuccess = health?.length ? Math.round(health.reduce((sum, item) => sum + item.successRate, 0) / health.length) : 100;
  const deliveries = endpoints.reduce((sum, endpoint) => sum + endpoint._count.deliveries, 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/dashboard/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    },
    onSuccess: (data) => {
      setSecret(data.secret);
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["webhook-health"] });
      setForm({ projectId: form.projectId, name: "", url: "", events: EVENT_OPTIONS });
      addToast("Webhook endpoint created", "success");
    },
    onError: () => addToast("Failed to create webhook", "error")
  });

  const testWebhook = useMutation({
    mutationFn: async (endpoint: WebhookEndpoint) => {
      setTestResult(null);
      const json = await apiFetch(`/api/dashboard/webhooks/${endpoint.id}/test`, { method: "POST" });
      const success = Boolean(json?.success ?? json?.data?.success);
      return {
        id: endpoint.id,
        success,
        message: success ? `${json?.status ?? json?.data?.status} in ${json?.durationMs ?? json?.data?.durationMs}ms` : json?.error ?? json?.data?.error ?? "Delivery failed"
      };
    },
    onSuccess: (result) => {
      setTestResult(result);
      refetchHealth();
    }
  });

  async function copySecret() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    addToast("Secret copied to clipboard", "success");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Main Content */}
      <div className="space-y-6">
        <div>
          <DashboardHeader
            title="Webhooks"
            description="Manage delivery endpoints and monitor event health"
          />

          {/* Metrics Grid */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Status</p>
            <DashboardGrid columns={4}>
              <StatCard label="Endpoints" value={endpoints.length} unit="total" />
              <StatCard label="Healthy" value={`${healthy}/${health?.length ?? 0}`} trend={healthy > 0 ? "up" : "down"} />
              <StatCard label="Success Rate" value={`${avgSuccess}%`} trend={avgSuccess >= 85 ? "up" : "down"} />
              <StatCard label="Total Deliveries" value={deliveries} unit="events" />
            </DashboardGrid>
          </div>
        </div>

        {/* Endpoints List */}
        <DashboardCard title="Endpoints" subtitle={`${endpoints.length} webhook endpoint${endpoints.length !== 1 ? "s" : ""} configured`}>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-zinc-500 py-8">Loading endpoints...</div>
            ) : endpoints.length ? (
              endpoints.map((endpoint) => (
                <EndpointRow
                  key={endpoint.id}
                  endpoint={endpoint}
                  health={healthById.get(endpoint.id)}
                  testing={testWebhook.isPending}
                  result={testResult?.id === endpoint.id ? testResult : null}
                  onTest={() => testWebhook.mutate(endpoint)}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <Webhook className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">No endpoints configured</p>
                <p className="text-xs text-zinc-500 mt-1">Create an endpoint to receive order events</p>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Sidebar - Create Endpoint */}
      <div className="space-y-4 lg:sticky lg:top-24 h-fit">
        <DashboardCard title="Create Endpoint">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-2">Project</label>
              <select
                className="w-full h-8 rounded-dense border border-white/10 bg-white/[0.03] px-2 text-sm text-zinc-300 hover:bg-white/[0.05]"
                value={form.projectId}
                onChange={(event) => setForm({ ...form, projectId: event.target.value })}
              >
                <option value="">Select project</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-2">Name</label>
              <Input
                placeholder="Production"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-2">URL</label>
              <Input
                placeholder="https://your-app.com/webhooks"
                value={form.url}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-2">Events</label>
              <div className="space-y-1">
                {EVENT_OPTIONS.map((event) => {
                  const checked = form.events.includes(event);
                  return (
                    <button
                      key={event}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          events: checked ? current.events.filter((item) => item !== event) : [...current.events, event]
                        }))
                      }
                      className={`w-full text-left rounded-dense border px-2 py-1.5 text-xs transition-colors ${
                        checked ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/[0.025] text-zinc-400 hover:bg-white/[0.05]"
                      }`}
                    >
                      {event}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full rounded-dense bg-cyan-600 hover:bg-cyan-700"
              disabled={!form.projectId || !form.name || !form.url || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </DashboardCard>

        {secret && (
          <DashboardCard title="Webhook Secret">
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">Save this secret now (shown once)</p>
              <code className="block break-all rounded-dense border border-amber-400/20 bg-amber-400/10 p-2 text-[10px] text-amber-100 font-mono">
                {secret}
              </code>
              <Button
                variant="outline"
                className="w-full rounded-dense gap-2"
                onClick={copySecret}
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}

function EndpointRow({
  endpoint,
  health,
  testing,
  result,
  onTest
}: {
  endpoint: WebhookEndpoint;
  health?: WebhookHealth;
  testing: boolean;
  result: { message: string; success: boolean } | null;
  onTest: () => void;
}) {
  const healthy = health?.healthy ?? true;

  return (
    <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="truncate text-sm font-semibold text-white">{endpoint.name}</p>
            <span className={`flex-shrink-0 rounded-dense px-2 py-0.5 text-xs font-semibold ${endpoint.status === "ACTIVE" ? "bg-emerald-400/20 text-emerald-200" : "bg-zinc-400/20 text-zinc-300"}`}>
              {endpoint.status.toLowerCase()}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-2">{endpoint.project.name}</p>
          <p className="truncate rounded-dense border border-white/10 bg-black/20 px-2 py-1 font-mono text-xs text-zinc-500 break-all">
            {endpoint.url}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 mb-1">
            {healthy ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-300" />
            )}
            <span className="text-sm font-semibold text-white">{health?.successRate ?? 100}%</span>
          </div>
          <p className="text-xs text-zinc-500">{endpoint._count.deliveries} deliveries</p>
        </div>
      </div>

      {/* Events */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(endpoint.events?.length ? endpoint.events : EVENT_OPTIONS).map((event) => (
          <span key={event} className="rounded-dense border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-400">
            {event}
          </span>
        ))}
      </div>

      {/* Test Result */}
      {result && (
        <div className={`rounded-dense border px-2 py-1.5 mb-2 text-xs ${result.success ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>
          {result.message}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 gap-2 rounded-dense text-xs"
          disabled={testing}
          onClick={onTest}
        >
          <RotateCw className={`h-3 w-3 ${testing ? "animate-spin" : ""}`} />
          {testing ? "Testing..." : "Test"}
        </Button>
        <EditEndpointButton endpoint={endpoint} />
        <DeleteEndpointButton endpointId={endpoint.id} />
      </div>
    </div>
  );
}

function EditEndpointButton({ endpoint }: { endpoint: WebhookEndpoint }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: endpoint.name, url: endpoint.url, events: endpoint.events ?? [], status: endpoint.status });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  async function save() {
    try {
      await apiFetch(`/api/dashboard/webhooks/${endpoint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["webhook-health"] });
      addToast("Webhook updated", "success");
      setOpen(false);
    } catch (err) {
      addToast("Failed to update webhook", "error");
    }
  }

  async function rotateSecret() {
    try {
      const res = await apiFetch(`/api/dashboard/webhooks/${endpoint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotateSecret: true })
      });
      const secret = res?.secret ?? res?.data?.secret;
      if (secret) {
        await navigator.clipboard.writeText(secret);
        addToast("New secret generated and copied to clipboard", "success");
      } else {
        addToast("Secret rotated", "success");
      }
    } catch (err) {
      addToast("Failed to rotate secret", "error");
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="rounded-dense px-3 py-1 h-7 text-xs bg-white/[0.02] border border-white/10 hover:bg-white/[0.04]"
        aria-label="Edit endpoint"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-dense bg-[rgba(11,11,15,0.98)] border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Edit Endpoint</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">URL</label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Events</label>
                <div className="space-y-1">
                  {EVENT_OPTIONS.map((ev) => {
                    const checked = form.events.includes(ev);
                    return (
                      <button
                        key={ev}
                        type="button"
                        onClick={() => setForm((cur) => ({ ...cur, events: checked ? cur.events.filter((i) => i !== ev) : [...cur.events, ev] }))}
                        className={`w-full text-left rounded-dense border px-2 py-1.5 text-xs transition-colors ${checked ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/[0.025] text-zinc-400 hover:bg-white/[0.05]"}`}
                      >
                        {ev}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-8 rounded-dense border border-white/10 bg-white/[0.03] px-2 text-sm text-zinc-300">
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <Button onClick={save} className="flex-1">Save</Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="ghost" onClick={rotateSecret}>Rotate Secret</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteEndpointButton({ endpointId }: { endpointId: string }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/dashboard/webhooks/${id}`, { method: "DELETE" });
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["webhooks"] });
      const previous = queryClient.getQueryData<WebhookEndpoint[]>(["webhooks"]);
      queryClient.setQueryData(["webhooks"], (old: any) => (Array.isArray(old) ? old.filter((e) => e.id !== id) : old));
      return { previous };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["webhooks"], context.previous);
      }
      addToast("Failed to delete webhook", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["webhook-health"] });
    }
  });

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this webhook endpoint? This action cannot be undone.")) return;
    deleteMutation.mutate(endpointId);
  }

  return (
    <button onClick={handleDelete} className="rounded-dense px-3 py-1 h-7 text-xs bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 text-red-200">Delete</button>
  );
}
