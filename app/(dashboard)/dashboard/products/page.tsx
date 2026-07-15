"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { Copy, Edit2, ExternalLink, Filter, Search, Trash2, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-context";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardGrid, StatCard, DashboardCard } from "@/components/dashboard/card-components";
import apiFetch from "@/lib/api/client";

type Project = { id: string; name: string };
type ProductItem = {
  id: string;
  name: string;
  price: number | string;
  currency?: string;
  planType?: string | null;
  status?: string;
  createdAt?: string;
  project?: Project | null;
  projectId?: string;
  metrics?: {
    orderCount: number;
    paidOrderCount: number;
    revenue: number;
    conversionRate: number;
  };
};

type UpdateMutationResult = {
  isPending: boolean;
  mutate: (data: { id: string; data: Partial<ProductItem> }) => void;
};

type ProductListResponse =
  | ProductItem[]
  | {
      data?: ProductItem[];
      meta?: { total?: number; page?: number; pageSize?: number; totalPages?: number };
    };

function normalizeProductsResponse(response: { data?: ProductListResponse }) {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function checkoutUrl(productId: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/checkout/${productId}`;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ projectId: "", name: "", price: "", planType: "LIFETIME" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [filterProject, setFilterProject] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "revenue_desc">("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { addToast } = useToast();

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await apiFetch("/api/dashboard/projects")) as Project[]
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => normalizeProductsResponse({ data: await apiFetch("/api/dashboard/products") }),
    staleTime: 15000,
    retry: 1
  });

  // debouncedSearch is handled by hook

  const filtered = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const q = debouncedSearch.toLowerCase();
    let output = list;

    if (q) {
      output = output.filter((product) => product.name.toLowerCase().includes(q) || product.project?.name?.toLowerCase().includes(q));
    }

    if (filterProject) {
      output = output.filter((product) => product.projectId === filterProject);
    }

    if (sort === "price_asc") output = output.slice().sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price_desc") output = output.slice().sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "revenue_desc") output = output.slice().sort((a, b) => (b.metrics?.revenue ?? 0) - (a.metrics?.revenue ?? 0));
    if (sort === "newest") output = output.slice().sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

    return output;
  }, [products, debouncedSearch, filterProject, sort]);

  const totals = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return {
      products: list.length,
      revenue: list.reduce((sum, product) => sum + (product.metrics?.revenue ?? 0), 0),
      orders: list.reduce((sum, product) => sum + (product.metrics?.orderCount ?? 0), 0),
      conversion: list.length ? Math.round(list.reduce((sum, product) => sum + (product.metrics?.conversionRate ?? 0), 0) / list.length) : 0
    };
  }, [products]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const createMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch("/api/dashboard/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setForm({ projectId: form.projectId, name: "", price: "", planType: "LIFETIME" });
      addToast("Product created successfully");
    },
    onError: () => addToast("Failed to create product")
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductItem> }) => {
      return await apiFetch(`/api/dashboard/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingId(null);
      addToast("Product updated successfully");
    },
    onError: () => addToast("Failed to update product")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch(`/api/dashboard/products/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeletingId(null);
      addToast("Product deleted successfully");
    },
    onError: () => addToast("Failed to delete product")
  });

  async function copyCheckout(productId: string) {
    await navigator.clipboard.writeText(checkoutUrl(productId));
    addToast("Checkout link copied");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Header */}
        <div>
          <DashboardHeader
            title="Products"
            description="Manage checkout links, pricing, and catalog"
          />

          {/* Metrics Grid */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Catalog Stats</p>
            <DashboardGrid columns={4}>
              <StatCard label="Total Products" value={totals.products} unit="active" />
              <StatCard label="Revenue" value={formatCurrency(totals.revenue)} />
              <StatCard label="Orders" value={totals.orders} unit="total" />
              <StatCard label="Conversion" value={`${totals.conversion}%`} trend="up" />
            </DashboardGrid>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid gap-3 md:grid-cols-[1fr_180px_150px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              className="pl-9 pr-9 text-sm"
              placeholder="Search products or projects"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            className="h-9 rounded-dense border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-300 hover:bg-white/[0.05]"
            value={filterProject}
            onChange={(event) => setFilterProject(event.target.value)}
          >
            <option value="">All projects</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-dense border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-300 hover:bg-white/[0.05]"
            value={sort}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setSort(event.target.value as "newest" | "price_asc" | "price_desc" | "revenue_desc")}
          >
            <option value="newest">Newest</option>
            <option value="revenue_desc">Revenue</option>
            <option value="price_asc">Price Low</option>
            <option value="price_desc">Price High</option>
          </select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-dense border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : paginated.length ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((product) => (
              <ProductCardCompact
                key={product.id}
                product={product}
                onEdit={() => {
                  setEditingId(product.id);
                  setEditForm({ name: product.name, price: String(product.price) });
                }}
                onDelete={() => {
                  setConfirmId(product.id);
                  setConfirmName(product.name);
                  setConfirmOpen(true);
                }}
                onCopyCheckout={() => copyCheckout(product.id)}
                isEditing={editingId === product.id}
                editForm={editForm}
                setEditForm={setEditForm}
                updateMutation={updateMutation}
              />
            ))}
          </div>
        ) : (
          <DashboardCard>
            <div className="text-center py-8">
              <Filter className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">No products found</p>
              <p className="text-xs text-zinc-500 mt-1">Create your first product or clear filters</p>
            </div>
          </DashboardCard>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col gap-2 rounded-dense border border-white/10 bg-white/[0.02] p-3 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-zinc-400">
              Showing {total ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="h-7 px-2"
              >
                ←
              </Button>
              <div className="text-xs text-zinc-300 min-w-8 text-center">
                {page}/{totalPages}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="h-7 px-2"
              >
                →
              </Button>
              <select
                className="h-7 rounded-dense border border-white/10 bg-white/[0.03] px-2 text-xs text-zinc-300 hover:bg-white/[0.05]"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option value={6}>6/page</option>
                <option value={9}>9/page</option>
                <option value={18}>18/page</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Create New Product Sidebar */}
      <div className="lg:sticky lg:top-24 h-fit">
        <DashboardCard title="Create Product">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-2">Project</label>
              <select
                className="w-full h-8 rounded-dense border border-white/10 bg-white/[0.03] px-2 text-sm text-zinc-300 hover:bg-white/[0.05]"
                value={form.projectId}
                onChange={(event) => setForm({ ...form, projectId: event.target.value })}
              >
                <option value="">Choose a project</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-2">Product Name</label>
              <Input
                placeholder="Premium plan"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-2">Price (INR)</label>
              <Input
                placeholder="999"
                type="number"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-2">Plan Type</label>
              <select
                className="w-full h-8 rounded-dense border border-white/10 bg-white/[0.03] px-2 text-sm text-zinc-300 hover:bg-white/[0.05]"
                value={form.planType}
                onChange={(event) => setForm({ ...form, planType: event.target.value })}
              >
                <option value="LIFETIME">Lifetime</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <Button
              className="w-full rounded-dense bg-cyan-600 hover:bg-cyan-700"
              disabled={!form.projectId || !form.name || !form.price || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </DashboardCard>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete Product">
        <p className="text-sm text-zinc-300">
          Delete <strong>{confirmName}</strong>? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (!confirmId) return;
              setDeletingId(confirmId);
              deleteMutation.mutate(confirmId);
              setConfirmOpen(false);
            }}
          >
            {deleteMutation.isPending && deletingId === confirmId ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ProductCardCompact({
  product,
  onEdit,
  onDelete,
  onCopyCheckout,
  isEditing,
  editForm,
  setEditForm,
  updateMutation
}: {
  product: ProductItem;
  onEdit: () => void;
  onDelete: () => void;
  onCopyCheckout: () => void;
  isEditing: boolean;
  editForm: { name: string; price: string };
  setEditForm: (form: { name: string; price: string }) => void;
  updateMutation: UpdateMutationResult;
}) {
  return (
    <div className="rounded-dense border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-dense border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{product.name}</p>
            <p className="truncate text-xs text-zinc-500">{product.project?.name || "No project"} · {product.planType?.toLowerCase() || "once"}</p>
          </div>
        </div>
        <span className="flex-shrink-0 rounded-dense border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
          {(product.status || "ACTIVE").toLowerCase()}
        </span>
      </div>

      {isEditing ? (
        <div className="space-y-2 mb-3">
          <Input
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Product name"
            className="text-xs"
          />
          <Input
            type="number"
            value={editForm.price}
            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
            placeholder="Price"
            className="text-xs"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  id: product.id,
                  data: { name: editForm.name, price: Number(editForm.price) }
                })
              }
              className="flex-1 h-7 text-xs"
            >
              {updateMutation.isPending ? "..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditForm({ name: "", price: "" })}
              className="h-7 px-2 text-xs"
            >
              ✕
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <p className="text-lg font-semibold text-white">{formatCurrency(product.price, product.currency || "INR")}</p>
          </div>

          {/* Compact Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="rounded-dense bg-white/[0.03] p-2 border border-white/5">
              <p className="text-zinc-500 text-[10px]">Revenue</p>
              <p className="font-semibold text-white text-xs">{formatCurrency(product.metrics?.revenue || 0)}</p>
            </div>
            <div className="rounded-dense bg-white/[0.03] p-2 border border-white/5">
              <p className="text-zinc-500 text-[10px]">Orders</p>
              <p className="font-semibold text-white text-xs">{product.metrics?.orderCount || 0}</p>
            </div>
            <div className="rounded-dense bg-white/[0.03] p-2 border border-white/5">
              <p className="text-zinc-500 text-[10px]">Conv.</p>
              <p className="font-semibold text-white text-xs">{product.metrics?.conversionRate || 0}%</p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 rounded-dense"
              onClick={onCopyCheckout}
            >
              <Copy className="h-3 w-3" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 rounded-dense"
              onClick={onEdit}
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 rounded-dense"
              onClick={() => window.open(checkoutUrl(product.id), "_blank")}
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 rounded-dense text-red-300 hover:bg-red-400/10"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
