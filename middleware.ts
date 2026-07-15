import { NextRequest, NextResponse } from "next/server";

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
  matcher: ['/dashboard', '/dashboard/:path*', '/admin/:path*', '/login', '/signup']
};
