import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import * as jose from "jose";
import { cookies } from "next/headers";

export async function GET() {
  // 1. Read the NextAuth session Google just gave us
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
  }

  // 2. Look up the user in our DB by their Google email
  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
  }

  // 3. Get their role (landlord or tenant)
  const userRole = await db.userRole.findFirst({
    where: { userId: user.id },
  });

  if (!userRole) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
  }

  // 4. If tenant, also get tenantId for the JWT payload
  let tenantId: string | undefined;
  if (userRole.role === "tenant") {
    const tenant = await db.tenant.findFirst({
      where: { userId: user.id },
    });
    tenantId = tenant?.id;
  }

  // 5. Build EXACT same payload as actions.tsx (email/password login)
  const payload = {
    userId: user.id,
    email: user.email,
    role: userRole.role,
    landlordId: userRole.landlordId,
    tenantId,
    image: session.user.image ?? null, // Google profile photo URL (null for email/password users)
  };

  // 6. Sign the JWT — same secret + algo as actions.tsx
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);

  // 7. Set the same `session` cookie the middleware reads
  (await cookies()).set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours — matches JWT expiry
  });

  // 8. Redirect to the right dashboard based on role
  const redirectPath =
    userRole.role === "tenant" ? "/dashboard/tenant" : "/dashboard/landlord";

  return NextResponse.redirect(
    new URL(redirectPath, process.env.NEXTAUTH_URL!),
  );
}
