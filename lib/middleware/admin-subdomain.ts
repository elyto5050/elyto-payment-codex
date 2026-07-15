/**
 * Subdomain Routing Middleware for Admin Panel
 * Routes admin.elyto.in to the admin-specific UI
 * 
 * This middleware intercepts requests based on subdomain and routes appropriately
 */

import { NextRequest, NextResponse } from "next/server";

export function adminSubdomainMiddleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl;

  // Check if request is for admin subdomain
  const isAdminSubdomain = host.startsWith("admin.") || host.startsWith("admin-");

  if (isAdminSubdomain) {
    // Rewrite to admin routes
    // admin.elyto.in/ → /admin/...
    // admin.elyto.in/users → /admin/users
    const pathname = url.pathname;

    // If root, redirect to dashboard
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/admin", request.url));
    }

    // If not already in /admin path, prepend it
    if (!pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Function to detect admin panel subdomain
 */
export function isAdminSubdomain(host: string): boolean {
  return host.startsWith("admin.") || host.startsWith("admin-");
}

/**
 * Get admin panel URL for environment
 */
export function getAdminPanelUrl(env: "development" | "staging" | "production" = "production"): string {
  const domains = {
    development: "http://admin.localhost:3000",
    staging: "https://admin-staging.elyto.in",
    production: "https://admin.elyto.in",
  };
  return domains[env];
}

/**
 * Redirect user to admin panel if they have permissions
 */
export function redirectToAdminPanel(userRole: string): boolean {
  const adminRoles = ["OWNER", "ADMIN"];
  return adminRoles.includes(userRole);
}

/**
 * Environment variables for admin setup
 */
export const ADMIN_CONFIG = {
  // Main dashboard domain
  MAIN_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || "elyto.in",

  // Admin subdomain
  ADMIN_DOMAIN: process.env.NEXT_PUBLIC_ADMIN_DOMAIN || "admin.elyto.in",

  // API base (shared across both)
  API_BASE: process.env.NEXT_PUBLIC_API_URL || "https://api.elyto.in",

  // Admin session cookie name (separate from main)
  ADMIN_SESSION_COOKIE: "admin_session",

  // Main session cookie name
  MAIN_SESSION_COOKIE: "session",
} as const;

/**
 * Check if user should be redirected to admin panel
 */
export function shouldRedirectToAdmin(userRole: string, currentHost: string): boolean {
  const isAdmin = userRole === "OWNER" || userRole === "ADMIN" || userRole === "SUPPORT";
  const onAdminPanel = currentHost.includes("admin.");

  // If user is admin but not on admin panel, redirect
  return isAdmin && !onAdminPanel;
}
