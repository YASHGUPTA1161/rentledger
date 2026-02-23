import * as jose from "jose";
import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    // Extract user context from JWT
    const role = payload.role as string;
    const landlordId = payload.landlordId as string | null;
    const userId = payload.userId as string;

    // If user hits generic /dashboard, redirect to role-specific dashboard
    if (request.nextUrl.pathname === "/dashboard") {
      if (role === "landlord") {
        return NextResponse.redirect(
          new URL("/dashboard/landlord", request.url),
        );
      } else if (role === "tenant") {
        return NextResponse.redirect(new URL("/dashboard/tenant", request.url));
      } else if (role === "admin") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
    }

    // For all other protected routes, let them through with context in headers
    // ── ROLE-BASED ROUTE PROTECTION ──
    // A tenant typing /dashboard/landlord in the URL bar gets blocked
    // A landlord typing /dashboard/tenant also gets blocked
    const path = request.nextUrl.pathname;

    if (path.startsWith("/dashboard/landlord") && role !== "landlord") {
      // Non-landlord trying to access landlord routes → kick them to their dashboard
      return NextResponse.redirect(new URL("/dashboard/tenant", request.url));
    }

    if (path.startsWith("/dashboard/tenant") && role !== "tenant") {
      // Non-tenant trying to access tenant routes → kick them to their dashboard
      return NextResponse.redirect(new URL("/dashboard/landlord", request.url));
    }

    // ── Pass user context in headers (for server components to read) ──
    const response = NextResponse.next();
    response.headers.set("X-user-id", userId);
    response.headers.set("X-user-email", payload.email as string);
    response.headers.set("X-user-role", role);
    response.headers.set("X-landlord-id", landlordId || "");
    response.headers.set("X-tenant-id", (payload.tenantId as string) || "");
    return response;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard", // Exact match
    "/dashboard/:path*", // Subpaths
    "/profile/:path*",
    "/settings/:path*",
  ],
};
