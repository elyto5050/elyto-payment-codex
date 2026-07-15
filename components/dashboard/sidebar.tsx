"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CreditCard,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Bell,
  LifeBuoy,
  MailCheck,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Users,
  Webhook
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/gmail", label: "Gmail", icon: MailCheck },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  { href: "/dashboard/security", label: "Security", icon: Shield },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-border bg-card px-4 py-5">
      <div className="mb-8">
        <Logo size={28} withText={false} />
      </div>
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === href ? "bg-primary/15 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
