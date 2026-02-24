"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import db from "@/lib/prisma";
import resend from "@/lib/resend";

export async function sendInvite(tenantId: string, propertyId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return { success: false, error: "Not Authenticated" };

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    const tenant = await db.tenant.findFirst({
      where: { id: tenantId, landlordId },
      include: { user: true },
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    // Always use User.email — this is the login credential, not tenant.email (contact field)
    const tenantEmail = tenant.user.email;
    if (!tenantEmail) {
      return { success: false, error: "Tenant has no email. Add email first." };
    }

    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    const inviteToken = await db.inviteToken.create({
      data: {
        email: tenantEmail,
        tenantId,
        landlordId,
        propertyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), //7 days
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
    const inviteLink = `${baseUrl}/invite/${inviteToken.token}`;

    await resend.emails.send({
      // WHY this env var:
      //   onboarding@resend.dev only delivers to Resend account owner's email.
      //   Once you verify a domain (e.g. rentledger.online), you MUST send FROM
      //   an address at that domain. Set RESEND_FROM_EMAIL in Vercel env vars.
      from: `RentLedger <${process.env.RESEND_FROM_EMAIL ?? "noreply@contact.rentledger.online"}>`,
      to: tenantEmail,
      subject: "You've been invited to RentLedger",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>Welcome to RentLedger!</h2>
          <p>Your landlord has invited you to manage your tenancy at:</p>
          <p style="font-weight: bold; font-size: 1.1rem;">
            ${property?.address || "your rental property"}
          </p>
          <p>Click the button below to set your password and access your dashboard:</p>
          <a href="${inviteLink}"
             style="display: inline-block; padding: 12px 24px;
                    background: #2563eb; color: white; border-radius: 8px;
                    text-decoration: none; font-weight: 600;">
            Accept Invitation
          </a>
          <p style="color: #6b7280; font-size: 0.85rem; margin-top: 24px;">
            This link expires in 7 days.
          </p>
        </div>
      `,
    });

    // Return actual email used — button toast shows this, not the contact field
    return { success: true, message: "Invitation sent!", email: tenantEmail };
  } catch (error) {
    console.error("Send invite error:", error);
    return { success: false, error: "Failed to send invite" };
  }
}
// ─── Generate invite link (no email) — for manual sharing ───
export async function generateInviteLink(tenantId: string, propertyId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return { success: false, error: "Not Authenticated" };

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    // Same tenant lookup as sendInvite
    const tenant = await db.tenant.findFirst({
      where: { id: tenantId, landlordId },
      include: { user: true },
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    // Create invite token — same as sendInvite line 34-42
    const inviteToken = await db.inviteToken.create({
      data: {
        // Always use User.email — the login credential, not the contact email field
        email: tenant.user.email,
        tenantId,
        landlordId,
        propertyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
    const inviteLink = `${baseUrl}/invite/${inviteToken.token}`;

    // Return the link instead of emailing it
    return { success: true, link: inviteLink };
  } catch (error) {
    console.error("Generate invite link error:", error);
    return { success: false, error: "Failed to generate link" };
  }
}
