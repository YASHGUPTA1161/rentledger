import db from "@/lib/prisma";
import { redirect } from "next/navigation";
import AcceptInviteForm from "./accept-invite-form";

// This is a SERVER component (no "use client")
// It runs on the server, checks the token, and renders the form

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // ── Look up the token in DB ──
  const invite = await db.inviteToken.findUnique({
    where: { token },
    include: {
      tenant: true,
      property: true,
    },
  });

  // ── Validate token ──
  // 3 things can go wrong:
  if (!invite) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>❌ Invalid Invite</h1>
        <p>This invite link is not valid. Ask your landlord for a new one.</p>
      </div>
    );
  }

  if (invite.usedAt) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>✅ Already Accepted</h1>
        <p>You&apos;ve already set up your account.</p>
        <a href="/login" style={{ color: "#2563eb" }}>
          Go to Login →
        </a>
      </div>
    );
  }

  if (new Date() > invite.expiresAt) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>⏰ Link Expired</h1>
        <p>This invite link has expired. Ask your landlord to resend it.</p>
      </div>
    );
  }

  // ── Token is valid → show the set-password form ──
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "32px",
          maxWidth: "420px",
          width: "100%",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: "1.5rem" }}>
          Welcome to RentLedger
        </h1>
        <p style={{ color: "#6b7280", margin: "0 0 4px" }}>
          Property: <strong>{invite.property.address}</strong>
        </p>
        <p style={{ color: "#6b7280", margin: "0 0 4px" }}>
          Your login email: <strong>{invite.email}</strong>
        </p>
        <p style={{ color: "#6b7280", margin: "0 0 24px" }}>
          Tenant: <strong>{invite.tenant.fullName}</strong>
        </p>

        <AcceptInviteForm token={token} />
      </div>
    </div>
  );
}
