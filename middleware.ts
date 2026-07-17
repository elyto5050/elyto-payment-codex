import { NextRequest, NextResponse } from "next/server";
import { isAdminApp, isWebApp } from "@/lib/app-mode";

function isSafeRelativePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

// Minimal middleware: protect dashboard/admin routes and redirect auth pages.
// IMPORTANT: do NOT attempt to parse or decode Auth.js/NextAuth JWTs here.
export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

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

  // MODE-based routing (APP_MODE) — no hostname checks here.
  {
    const isNextData = path.startsWith("/_next/data/");
    const isNextStatic = path.startsWith("/_next/static") || path.startsWith("/_next/image");
    const isFavicon = path === "/favicon.ico";

    const publicExts = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".webp",
      ".ico",
      ".css",
      ".js",
      ".xml",
      ".txt",
      ".json",
      ".woff",
      ".woff2",
    ];
    const lcPath = path.toLowerCase();
    const looksLikeStaticFile =
      publicExts.some((ext) => lcPath.endsWith(ext)) ||
      lcPath === "/robots.txt" ||
      lcPath === "/sitemap.xml" ||
      lcPath === "/manifest.json";

    const adminMode = isAdminApp();
    const webMode = isWebApp();

    // Admin deployment behavior: serve admin app at root and other public pages
    if (adminMode) {
      if (path.startsWith("/api") || isNextStatic || isFavicon || looksLikeStaticFile) {
        // let these pass
      } else if (!path.startsWith("/admin")) {
        // Rewrite to /admin (preserve browser URL)
        if (isNextData) {
          const parts = path.split("/").filter(Boolean);
          if (parts.length >= 4) {
            const buildId = parts[2];
            const rest = parts.slice(3);
            if (rest[0] !== "admin") {
              const newUrl = req.nextUrl.clone();
              newUrl.pathname = `/_next/data/${buildId}/admin/${rest.join("/")}`;
              return NextResponse.rewrite(newUrl);
            }
          }
        } else {
          const newUrl = req.nextUrl.clone();
          newUrl.pathname = path === "/" ? "/admin" : `/admin${path}`;
          return NextResponse.rewrite(newUrl);
        }
      }
    }

    // Web deployment behavior: redirect /admin to external admin origin
    if (webMode) {
      if (path.startsWith("/admin")) {
        const adminHost = process.env.ADMIN_HOST || "admin.elyto.in";
        const adminOrigin = process.env.ADMIN_URL ? process.env.ADMIN_URL.replace(/\/$/, "") : `https://${adminHost}`;
        const destination = `${adminOrigin}${path}${req.nextUrl.search}`;
        return NextResponse.redirect(destination);
      }
    }
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
