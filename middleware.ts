import { NextRequest, NextResponse } from "next/server";

const ADMIN_HOST = (process.env.ADMIN_HOST || "admin.elyto.in").toLowerCase();

function getHostname(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const hostHeader = req.headers.get("host");
  const rawHost = forwardedHost || hostHeader || req.nextUrl.hostname;

  return rawHost.split(",")[0].trim().split(":")[0].toLowerCase();
}

function isSafeRelativePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

// Minimal middleware: protect dashboard/admin routes and redirect auth pages.
// IMPORTANT: do NOT attempt to parse or decode Auth.js/NextAuth JWTs here.
export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const hostname = getHostname(req);
  const isAdminHost = hostname === ADMIN_HOST;

  const isDashboard = path.startsWith("/dashboard");
  const isAdmin = path.startsWith("/admin");
  const isAuthPage = path === "/login" || path === "/signup";

  // Common Auth.js / NextAuth cookie names (only checking presence)
  const cookieNames = [
    "__Secure-authjs.session-token",
    "authjs.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ];

  let hasSession = false;
  for (const name of cookieNames) {
    const c = req.cookies.get(name);
    if (c?.value) {
      hasSession = true;
      break;
    }
  }

  // Host-aware internal rewrite:
  // admin.elyto.in/  ->  /admin
  // This keeps the browser URL as admin.elyto.in while rendering the admin app.
  if (isAdminHost && path === "/") {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = "/admin";
    return NextResponse.rewrite(rewriteUrl);
  }

  // Redirect unauthenticated users away from protected dashboard/admin routes
  if ((isDashboard || isAdmin) && !hasSession) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${path}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages.
  // Preserve callbackUrl when present so admin logins return to /admin.
  if (hasSession && isAuthPage) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");

    if (callbackUrl && isSafeRelativePath(callbackUrl)) {
      return NextResponse.redirect(new URL(callbackUrl, req.nextUrl.origin));
    }

    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*", "/login", "/signup"],
};
