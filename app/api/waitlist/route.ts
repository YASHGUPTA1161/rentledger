import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import resend from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { firstName, email } = await req.json();

    if (!firstName || !email) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // ── Check for duplicate ────────────────────────────────────────────────
    const existing = await db.waitlistEntry.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "already_registered" },
        { status: 409 },
      );
    }

    // ── Save to DB first ───────────────────────────────────────────────────
    // emailSent = false until we confirm Resend succeeded
    const entry = await db.waitlistEntry.create({
      data: { firstName, email, emailSent: false },
    });

    // ── Send welcome email ─────────────────────────────────────────────────
    await resend.emails.send({
      from: `RentLedger <${process.env.RESEND_FROM_EMAIL ?? "noreply@contact.rentledger.online"}>`,
      to: email,
      subject: "You're on the RentLedger Waiting List! 🎉",
      html: `
        <div style="font-family:sans-serif; max-width:540px; margin:0 auto; color:#1e293b;">
          <div style="background:#0f172a; padding:24px; border-radius:8px 8px 0 0;">
            <h1 style="margin:0; color:#fff; font-size:1.2rem;">🏠 RentLedger</h1>
          </div>
          <div style="background:#fff; padding:28px; border:1px solid #e2e8f0;
                      border-top:none; border-radius:0 0 8px 8px;">
            <h2 style="margin:0 0 8px; font-size:1.2rem;">
              Dear ${firstName},
            </h2>
            <p style="margin:0 0 16px; color:#475569; line-height:1.7;">
              Thank you for joining the RentLedger waiting list! We're excited to
              have you on board. As promised, you'll receive <strong>1 month of
              free access</strong> when we launch.
            </p>
            <h3 style="margin:0 0 10px; font-size:1rem; color:#0f172a;">
              Here's what to expect:
            </h3>
            <ul style="margin:0 0 20px; padding-left:20px; color:#475569; line-height:1.8;">
              <li>Early access to RentLedger</li>
              <li>Exclusive updates and tips</li>
              <li>A free month to explore all features</li>
            </ul>
            <p style="margin:0 0 24px; color:#475569; line-height:1.7;">
              We'll notify you as soon as your free month begins. In the meantime,
              stay tuned for updates and helpful resources.
            </p>
            <p style="margin:0; color:#64748b;">
              Best regards,<br />
              <strong>The RentLedger Team</strong>
            </p>
          </div>
          <p style="margin:16px 0 0; font-size:0.75rem; color:#94a3b8; text-align:center;">
            © RentLedger — You received this because you joined our waitlist.
          </p>
        </div>
      `,
    });

    // ── Mark email as sent in DB ───────────────────────────────────────────
    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: { emailSent: true, emailSentAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
