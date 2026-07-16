import { NextRequest, NextResponse } from "next/server";

// Minimal middleware: protect dashboard/admin routes and redirect auth pages.
// IMPORTANT: do NOT attempt to parse or decode Auth.js/NextAuth JWTs here.
export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isAdmin = path.startsWith("/admin");
  const isAuthPage = path === "/login" || path === "/signup";

  // Host-aware internal rewrite for admin subdomain (minimal, conservative).
  // Goal: when a request arrives at the admin host, internally rewrite it
  // to the /admin segment (served by app/(admin)/admin) without redirecting
  // the browser. Also rewrite Next.js data requests so client navigation works.
  {
    const hostHeader = req.headers.get("host");
    const forwardedHost = req.headers.get("x-forwarded-host");
    const hostname = hostHeader ? hostHeader.split(":")[0] : req.nextUrl.hostname;
    const ADMIN_HOST = process.env.ADMIN_HOST || "admin.elyto.in";
    const pathname = req.nextUrl.pathname;

    // Debug logging (temporary): record request and evaluation values
    try {
      console.log('[MIDDLEWARE DEBUG] pathname=', pathname);
      console.log('[MIDDLEWARE DEBUG] hostHeader=', hostHeader);
      console.log('[MIDDLEWARE DEBUG] x-forwarded-host=', forwardedHost);
      console.log('[MIDDLEWARE DEBUG] nextUrl.hostname=', req.nextUrl.hostname);
      console.log('[MIDDLEWARE DEBUG] ADMIN_HOST=', ADMIN_HOST);
    } catch (e) {
      // ignore logging errors
    }

    if (hostname === ADMIN_HOST) {
      // Do not rewrite API routes or Next internals or favicon.
      const isNextData = pathname.startsWith("/_next/data/");
      const isNextStatic = pathname.startsWith("/_next/static") || pathname.startsWith("/_next/image");
      const isFavicon = pathname === "/favicon.ico";

      // Minimal public/static asset detection: skip rewriting common public files
      // or paths that look like static files by extension.
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
        ".woff2"
      ];
      const lcPath = pathname.toLowerCase();
      const looksLikeStaticFile = publicExts.some((ext) => lcPath.endsWith(ext)) ||
        lcPath === "/robots.txt" ||
        lcPath === "/sitemap.xml" ||
        lcPath === "/manifest.json";

      const rewriteCondition = !pathname.startsWith("/admin") && !pathname.startsWith("/api") && !isNextStatic && !isFavicon && !looksLikeStaticFile;

      try {
        console.log('[MIDDLEWARE DEBUG] hostnameEqualsAdmin=', hostname === ADMIN_HOST);
        console.log('[MIDDLEWARE DEBUG] rewriteConditionPartial=', rewriteCondition);
      } catch (e) {
        // ignore
      }

      if (rewriteCondition) {
        // Handle Next.js data requests specially:
        // /_next/data/<buildId>/page.json  => /_next/data/<buildId>/admin/page.json
        if (isNextData) {
          const parts = pathname.split("/").filter(Boolean); // ['_next','data','<buildId>', ...rest]
          if (parts.length >= 4) {
            const buildId = parts[2];
            const rest = parts.slice(3);
            if (rest[0] !== "admin") {
              const newUrl = req.nextUrl.clone();
              newUrl.pathname = `/_next/data/${buildId}/admin/${rest.join("/")}`;
              try {
                console.log('[MIDDLEWARE DEBUG] willRewrite=', true);
                console.log('[MIDDLEWARE DEBUG] rewrittenPath=', newUrl.pathname);
              } catch (e) {
                // ignore
              }
              return NextResponse.rewrite(newUrl);
            }
          }
        } else {
          const newUrl = req.nextUrl.clone();
          newUrl.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
          try {
            console.log('[MIDDLEWARE DEBUG] willRewrite=', true);
            console.log('[MIDDLEWARE DEBUG] rewrittenPath=', newUrl.pathname);
          } catch (e) {
            // ignore
          }
          return NextResponse.rewrite(newUrl);
        }
      } else {
        try {
          console.log('[MIDDLEWARE DEBUG] willRewrite=', false);
          console.log('[MIDDLEWARE DEBUG] reason_not_rewriting=', {
            startsWithAdmin: pathname.startsWith("/admin"),
            startsWithApi: pathname.startsWith("/api"),
            isNextStatic,
            isFavicon,
            looksLikeStaticFile
          });
        } catch (e) {
          // ignore
        }
      }
    } else {
      try {
        console.log('[MIDDLEWARE DEBUG] hostnameEqualsAdmin=', false);
      } catch (e) {}
    }
  }

  // Common Auth.js / NextAuth cookie names (only checking presence)
  const cookieNames = [
    "__Secure-authjs.session-token",
    "authjs.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.session-token"
  ];

  let hasSession = false;
  for (const name of cookieNames) {
    const c = req.cookies.get(name);
    if (c?.value) {
      hasSession = true;
      break;
    }
  }

  try {
    console.log('[MIDDLEWARE] pathname=', path);
    console.log('[MIDDLEWARE] isLoggedIn=', hasSession);
  } catch (err) {
    // ignore logging errors on edge
  }

  // Redirect unauthenticated users away from protected dashboard/admin routes
  if ((isDashboard || isAdmin) && !hasSession) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages.
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard', '/dashboard/:path*', '/admin/:path*', '/login', '/signup']
};
