import { NextRequest, NextResponse } from "next/server";
import resend from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { name, email, category, message } = await req.json();

    if (!name || !email || !category || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const categoryLabels: Record<string, string> = {
      query: "❓ General Query",
      feature: "💡 Feature Request",
      bug: "🐛 Bug Report",
      other: "📬 Other",
    };

    await resend.emails.send({
      from: `RentLedger Contact <${process.env.RESEND_FROM_EMAIL ?? "noreply@contact.rentledger.online"}>`,
      to: "yashguptayg1161@gmail.com",
      replyTo: email, // ← hitting Reply in Gmail goes to the sender
      subject: `[RentLedger] ${categoryLabels[category] ?? category} from ${name}`,
      html: `
        <div style="font-family:sans-serif; max-width:540px; margin:0 auto; color:#1e293b;">
          <div style="background:#0f172a; padding:20px 24px; border-radius:8px 8px 0 0;">
            <h1 style="margin:0; color:#fff; font-size:1.1rem;">🏠 RentLedger — Contact Form</h1>
          </div>
          <div style="background:#fff; padding:24px; border:1px solid #e2e8f0;
                      border-top:none; border-radius:0 0 8px 8px;">

            <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:0.9rem;">
              <tr>
                <td style="padding:8px 12px; background:#f8fafc; font-weight:600;
                           border:1px solid #e2e8f0; width:30%;">Category</td>
                <td style="padding:8px 12px; border:1px solid #e2e8f0;">
                  ${categoryLabels[category] ?? category}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f8fafc; font-weight:600;
                           border:1px solid #e2e8f0;">Name</td>
                <td style="padding:8px 12px; border:1px solid #e2e8f0;">${name}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f8fafc; font-weight:600;
                           border:1px solid #e2e8f0;">Email</td>
                <td style="padding:8px 12px; border:1px solid #e2e8f0;">
                  <a href="mailto:${email}">${email}</a>
                </td>
              </tr>
            </table>

            <h3 style="margin:0 0 8px; font-size:0.95rem; color:#374151;">Message</h3>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;
                        padding:16px; white-space:pre-wrap; font-size:0.9rem; line-height:1.6;">
              ${message}
            </div>

            <p style="margin-top:20px; font-size:0.75rem; color:#94a3b8;">
              Hit Reply to respond directly to ${name} at ${email}.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
