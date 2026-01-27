import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/strengths",
  "/team",
  "/directory",
  "/marketplace",
  "/mentorship",
  "/shoutouts",
  "/challenges",
  "/cards",
  "/leaderboard",
  "/feed",
  "/settings",
  "/admin",
  "/notifications",
  "/partnerships",
  "/reviews",
  "/chat",
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ["/auth/login", "/auth/register"];

// Admin-only routes (OWNER/ADMIN only - MANAGER cannot access)
// These routes involve member management, data imports, and system configuration
const adminOnlyRoutes = [
  "/admin/members",
  "/admin/import",
  "/admin/constants",
  "/admin/upload",
  "/admin/excel-import",
];

// Manager routes (accessible by OWNER, ADMIN, and MANAGER)
const managerRoutes = [
  "/admin/dashboard",
  "/admin/review-cycles",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if it's an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if it's an admin-only route (OWNER/ADMIN required, MANAGER excluded)
  const isAdminOnlyRoute = adminOnlyRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if it's a manager route (OWNER/ADMIN/MANAGER allowed)
  const isManagerRoute = managerRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control for admin routes
  if (token) {
    const role = token.role as string | undefined;

    // Admin-only routes: Only OWNER and ADMIN can access (not MANAGER)
    if (isAdminOnlyRoute) {
      if (role !== "OWNER" && role !== "ADMIN") {
        // Redirect to dashboard with access denied
        return NextResponse.redirect(new URL("/dashboard?error=access_denied", request.url));
      }
    }

    // Manager routes: OWNER, ADMIN, and MANAGER can access
    if (isManagerRoute) {
      if (role !== "OWNER" && role !== "ADMIN" && role !== "MANAGER") {
        return NextResponse.redirect(new URL("/dashboard?error=access_denied", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public|badges|domain-icons).*)",
  ],
};
