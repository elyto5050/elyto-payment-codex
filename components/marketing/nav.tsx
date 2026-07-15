import Link from "next/link";
import { Logo } from "@/components/logo";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/tutorials", label: "Tutorials" },
  { href: "/docs", label: "Docs" },
  { href: "/api-docs", label: "API" }
];

export function MarketingNav() {
  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <Logo />
      <div className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <Link href="/login" className="hidden text-zinc-300 hover:text-white sm:inline">
          Login
        </Link>
        <Link href="/signup" className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-violet-600">
          Get started
        </Link>
      </div>
    </nav>
  );
}
