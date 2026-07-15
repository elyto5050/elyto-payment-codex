import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkspaceShell, type ShellLink } from "@/components/workspace/app-shell";
import { isPlatformOwnerUser } from "@/lib/platform-owner";
import { ToastProvider } from "@/components/ui/toast-context";
import { NetworkMonitor } from "@/components/network-monitor";

// Admin navigation links per v2.0 specification
const links: ShellLink[] = [
  { href: "/admin", label: "Overview", icon: "overview" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/analytics", label: "Platform Analytics", icon: "analytics" },
  { href: "/admin/tickets", label: "Support Tickets", icon: "support" },
  { href: "/admin/roles", label: "Roles & Permissions", icon: "api", ownerOnly: true },
  { href: "/admin/legal", label: "Legal Pages", icon: "security", ownerOnly: true },
  { href: "/admin/settings", label: "Settings", icon: "settings", ownerOnly: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  const canAccessOwnerControls = await isPlatformOwnerUser(session.user.id, session.user.email);

  if (!canAccessOwnerControls && session.user.platformRole !== "ADMIN" && session.user.platformRole !== "SUPPORT") {
    redirect("/dashboard");
  }

  return (
    <ToastProvider>
      <NetworkMonitor />
      <WorkspaceShell
        title="Platform Command Center"
        description="Owner and staff controls across users, analytics, support, and settings."
        links={links}
        variant="admin"
        userName={session.user.name}
        userEmail={session.user.email}
        workspaceLabel="Elyto Admin"
        canAccessOwnerControls={canAccessOwnerControls}
      >
        {children}
      </WorkspaceShell>
    </ToastProvider>
  );
}
