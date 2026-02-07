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

    const response = NextResponse.next();
    response.headers.set("X-user-id", payload.sub as string);
    response.headers.set("x-user-email", payload.email as string);

    return response;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
export const config = {
  matcher: [
    // ONLY run middleware on these specific routes
    // Everything else (including /api/login, /api/signup) is SKIPPED
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
