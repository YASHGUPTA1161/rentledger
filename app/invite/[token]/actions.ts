"use server";

import db from "@/lib/prisma";
import bcrypt from "bcrypt";
import * as jose from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function acceptInvite(token: string, password: string) {
  try {
    // ── Find the invite token ──
    const invite = await db.inviteToken.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!invite) return { success: false, error: "Invalid invite" };
    if (invite.usedAt) return { success: false, error: "Already used" };
    if (new Date() > invite.expiresAt)
      return { success: false, error: "Expired" };

    // ── Hash the password ──
    // Same bcrypt.hash(password, 10) as your signup action
    // 10 = salt rounds (industry standard)
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Update the User record ──
    // Remember: when landlord created tenancy, a User was created with password: ""
    // Now we set the real password
    await db.user.update({
      where: { id: invite.tenant.userId },
      data: { password: hashedPassword },
    });

    // ── Create tenant UserRole if it doesn't exist ──
    // This gives the user the "tenant" role for login redirect
    const existingRole = await db.userRole.findFirst({
      where: { userId: invite.tenant.userId, role: "tenant" },
    });

    if (!existingRole) {
      await db.userRole.create({
        data: {
          userId: invite.tenant.userId,
          role: "tenant",
          landlordId: invite.landlordId,
        },
      });
    }

    // ── Mark token as used ──
    // Sets usedAt = now. If tenant clicks link again → "Already used"
    await db.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    // ── Create JWT session (same pattern as your login action) ──
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = await new jose.SignJWT({
      userId: invite.tenant.userId,
      email: invite.email,
      role: "tenant",
      landlordId: invite.landlordId,
      tenantId: invite.tenantId, // ← tenant-specific: used in tenant dashboard
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret);

    (await cookies()).set("session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 2,
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return { success: false, error: "Failed to set up account" };
  }

  // ── Redirect to tenant dashboard ──
  redirect("/dashboard/tenant");
}
