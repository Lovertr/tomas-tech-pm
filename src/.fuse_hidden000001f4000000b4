import { NextRequest, NextResponse } from "next/server";

// List of routes that don't require authentication
const publicRoutes = [
  "/login",
  "/api/auth/login",
  "/_next",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/_next" || route === "/favicon.ico") {
      return pathname.startsWith(route);
    }
    return pathname === route;
  });

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get("tt_session")?.value;

  if (!sessionToken) {
    // Redirect to login if no session token
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
