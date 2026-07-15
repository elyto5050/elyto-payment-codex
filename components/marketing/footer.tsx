"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/docs", label: "Docs" },
      { href: "/api-docs", label: "API Docs" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
      { href: "/status", label: "Status" }
    ]
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/refund", label: "Refund" },
      { href: "/security", label: "Security" }
    ]
  }
];

export function MarketingFooter() {
  const [social, setSocial] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/settings/social');
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setSocial(json.data || json || null);
        }
      } catch (_) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
              Automate UPI payment verification and order fulfillment for Indian businesses.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-medium text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-zinc-400 hover:text-zinc-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-medium text-white">Follow</h3>
            <div className="mt-4 flex items-center gap-3">
              {social?.instagramUrl && (
                <a href={social.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/4 hover:shadow-[0_8px_30px_rgba(6,182,212,0.12)] transition-shadow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /><circle cx="17.5" cy="6.5" r="0.5" fill="#fff"/></svg>
                </a>
              )}
              {social?.youtubeUrl && (
                <a href={social.youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/4 hover:shadow-[0_8px_30px_rgba(6,182,212,0.12)] transition-shadow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 8.5s-.2-1.6-.8-2.3c-.8-1-1.7-1-2.1-1.1C15.7 4.5 12 4.5 12 4.5h0s-3.7 0-6.9.1c-.4 0-1.3.1-2.1 1.1C2.2 6.9 2 8.5 2 8.5S1.9 10.3 1.9 12.1 2 15.7 2 15.7s.2 1.6.8 2.3c.8 1 1.9 1 2.4 1.1 1.7.2 6.7.3 6.7.3s3.7 0 6.9-.1c.4 0 1.3-.1 2.1-1.1.6-.7.8-2.3.8-2.3s.1-2 .1-3.8S22 8.5 22 8.5z" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 15.1V8.9l5 3.1-5 3.1z" fill="#fff"/></svg>
                </a>
              )}
              {social?.discordInviteUrl && (
                <a href={social.discordInviteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/4 hover:shadow-[0_8px_30px_rgba(6,182,212,0.12)] transition-shadow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4v12a4 4 0 004 4h8a4 4 0 004-4V4z" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 12a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zM16 12a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4z" fill="#fff"/></svg>
                </a>
              )}
            </div>
          </div>

        </div>
        <div className="mt-12 border-t border-border pt-8 text-sm text-zinc-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} Elyto. All rights reserved.</div>
          <div className="text-xs text-zinc-400">Built for Indian businesses • UPI verification automation</div>
        </div>
      </div>
    </footer>
  );
}
