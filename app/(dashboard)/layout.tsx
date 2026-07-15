import { auth } from "@/lib/auth";
import { WorkspaceShell, type ShellLink } from "@/components/workspace/app-shell";
import { ToastProvider } from "@/components/ui/toast-context";
import { NetworkMonitor } from "@/components/network-monitor";

const links: ShellLink[] = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/dashboard/projects", label: "Projects", icon: "projects" },
  { href: "/dashboard/products", label: "Products", icon: "products" },
  { href: "/dashboard/orders", label: "Orders", icon: "orders" },
  { href: "/dashboard/gmail", label: "Gmail", icon: "gmail" },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: "webhooks" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "analytics" },
  { href: "/dashboard/billing", label: "Billing", icon: "billing" },
  { href: "/dashboard/support", label: "Support", icon: "support" }
  // Team module deprecated as of v2.0
  // Activity module deprecated as of v2.0
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <ToastProvider>
      <NetworkMonitor />
      <WorkspaceShell
        title="Workspace"
        description="Orders, verification, Gmail, webhooks, and billing."
        links={links}
        variant="dashboard"
        userName={session?.user?.name}
        userEmail={session?.user?.email}
        workspaceLabel="Elyto Workspace"
      >
        {children}
      </WorkspaceShell>
    </ToastProvider>
  );
}
