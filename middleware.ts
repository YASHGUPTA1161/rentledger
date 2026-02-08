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
        return NextResponse.redirect(new URL("/dashboard/landlord", request.url));
      } else if (role === "tenant") {
        return NextResponse.redirect(new URL("/dashboard/tenant", request.url));
      } else if (role === "admin") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
    }

    // For all other protected routes, let them through with context in headers
    const response = NextResponse.next();
    response.headers.set("X-user-id", userId);
    response.headers.set("X-user-email", payload.email as string);
    response.headers.set("X-user-role", role);
    response.headers.set("X-landlord-id", landlordId || "");
    return response;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard",          // Exact match
    "/dashboard/:path*",   // Subpaths
    "/profile/:path*",
    "/settings/:path*",
  ],
};
