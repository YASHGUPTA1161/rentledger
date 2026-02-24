import * as jose from "jose";
import { NextResponse, NextRequest } from "next/server";
import {
  loginLimiter,
  signupLimiter,
  contactLimiter,
  waitlistLimiter,
} from "@/lib/rateLimit";

// ── Helper: get real client IP ────────────────────────────────────────────────
// x-forwarded-for is set by Vercel/proxies. Fallback to "anonymous" if missing.
function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous"
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = getIP(request);

  // ── Block 1: Rate limit public API routes ─────────────────────────────────
  //
  //  Flow:
  //    Bot sends 100 req/s to /api/auth/login
  //        → middleware checks Redis counter for this IP
  //        → counter exceeds limit → return 429 immediately
  //        → route handler NEVER runs, DB never touched
  //
  type LimitResult = { success: boolean; remaining: number; reset: number };
  let limitResult: LimitResult | null = null;

  if (path === "/api/auth/login") limitResult = await loginLimiter.limit(ip);
  if (path === "/api/auth/signup") limitResult = await signupLimiter.limit(ip);
  if (path === "/api/contact") limitResult = await contactLimiter.limit(ip);
  if (path === "/api/waitlist") limitResult = await waitlistLimiter.limit(ip);

  if (limitResult && !limitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          // Standard rate-limit headers — lets clients back off gracefully
          "Retry-After": String(
            Math.ceil((limitResult.reset - Date.now()) / 1000),
          ),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  // ── Block 2: Auth guard for dashboard routes ──────────────────────────────
  //  (existing logic — unchanged)
  if (!path.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    const role = payload.role as string;
    const landlordId = payload.landlordId as string | null;
    const userId = payload.userId as string;

    // Redirect /dashboard → role-specific page
    if (path === "/dashboard") {
      if (role === "landlord")
        return NextResponse.redirect(
          new URL("/dashboard/landlord", request.url),
        );
      if (role === "tenant")
        return NextResponse.redirect(new URL("/dashboard/tenant", request.url));
      if (role === "admin")
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }

    // Role-based route protection
    if (path.startsWith("/dashboard/landlord") && role !== "landlord")
      return NextResponse.redirect(new URL("/dashboard/tenant", request.url));

    if (path.startsWith("/dashboard/tenant") && role !== "tenant")
      return NextResponse.redirect(new URL("/dashboard/landlord", request.url));

    // Forward user context in headers
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
    // Dashboard auth guard
    "/dashboard",
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    // Rate-limited public API routes
    "/api/auth/login",
    "/api/auth/signup",
    "/api/contact",
    "/api/waitlist",
  ],
};
