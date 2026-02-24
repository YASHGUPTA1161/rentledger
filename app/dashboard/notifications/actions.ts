"use server";
import db from "@/lib/prisma";
import resend from "@/lib/resend";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";

export async function sendSelectedNotifications(formData: FormData) {
  const token = (await cookies()).get("session")?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const { payload } = await jwtVerify(token!, secret);
  const landlordId = payload.landlordId as string;

  // ── Parse form data ────────────────────────────────────────────────────────
  const selectedIds = JSON.parse(
    formData.get("selectedIds") as string,
  ) as string[];
  const title = formData.get("title") as string;
  const message = formData.get("message") as string;
  const type = formData.get("type") as "info" | "warning" | "error" | "system";
  const sendEmail = formData.get("sendEmail") === "true";
  const includeInvoice = formData.get("includeInvoice") === "true";

  if (selectedIds.length === 0) return { error: "No tenants selected" };

  // ── Security: verify all selected tenants belong to this landlord ──────────
  const tenants = await db.tenant.findMany({
    where: { id: { in: selectedIds }, landlordId },
    select: {
      id: true,
      fullName: true,
      userId: true,
      user: { select: { email: true } },
    },
  });

  if (tenants.length === 0) return { error: "No valid tenants found" };

  // ── Step 1: Create in-app notifications (one row per tenant) ───────────────
  await db.notification.createMany({
    data: tenants.map((t) => ({
      userId: t.userId,
      title,
      message,
      type,
      sentAt: new Date(),
    })),
  });

  // ── Step 2 (optional): Send emails via Resend ──────────────────────────────
  if (sendEmail) {
    for (const tenant of tenants) {
      const tenantEmail = tenant.user.email;
      if (!tenantEmail) continue;

      // If invoice template, fetch latest pending/partial bill for this tenant
      let invoiceHtml = "";
      if (includeInvoice) {
        const latestBill = await db.bill.findFirst({
          where: {
            tenantId: tenant.id,
            landlordId,
            status: { in: ["pending", "overdue"] },
          },
          orderBy: { month: "desc" },
        });

        if (latestBill) {
          const month = new Date(latestBill.month).toLocaleString("en-IN", {
            month: "long",
            year: "numeric",
          });
          const due = new Date(latestBill.dueDate).toLocaleDateString("en-IN");

          invoiceHtml = `
            <div style="margin-top:24px; background:#f8fafc; border:1px solid #e2e8f0;
                        border-radius:8px; padding:16px;">
              <h3 style="margin:0 0 12px; font-size:1rem; color:#1e293b;">
                📄 Invoice Summary — ${month}
              </h3>
              <table style="width:100%; border-collapse:collapse; font-size:0.875rem;">
                <tr>
                  <td style="padding:6px 0; color:#64748b;">Rent</td>
                  <td style="padding:6px 0; text-align:right; font-weight:600;">
                    ₹${latestBill.rent.toNumber().toLocaleString("en-IN")}
                  </td>
                </tr>
                ${
                  latestBill.electricityTotal
                    ? `
                <tr>
                  <td style="padding:6px 0; color:#64748b;">Electricity</td>
                  <td style="padding:6px 0; text-align:right;">
                    ₹${latestBill.electricityTotal.toNumber().toLocaleString("en-IN")}
                  </td>
                </tr>`
                    : ""
                }
                ${
                  latestBill.waterBill
                    ? `
                <tr>
                  <td style="padding:6px 0; color:#64748b;">Water</td>
                  <td style="padding:6px 0; text-align:right;">
                    ₹${latestBill.waterBill.toNumber().toLocaleString("en-IN")}
                  </td>
                </tr>`
                    : ""
                }
                ${
                  latestBill.carryForward.toNumber() > 0
                    ? `
                <tr>
                  <td style="padding:6px 0; color:#64748b;">Carry Forward</td>
                  <td style="padding:6px 0; text-align:right;">
                    ₹${latestBill.carryForward.toNumber().toLocaleString("en-IN")}
                  </td>
                </tr>`
                    : ""
                }
                <tr style="border-top:2px solid #e2e8f0;">
                  <td style="padding:10px 0 6px; font-weight:700; color:#0f172a;">
                    Total Due
                  </td>
                  <td style="padding:10px 0 6px; text-align:right;
                              font-weight:700; font-size:1.1rem; color:#0f172a;">
                    ₹${latestBill.remainingAmount.toNumber().toLocaleString("en-IN")}
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0; font-size:0.8rem; color:#64748b;">
                Due date: <strong>${due}</strong>
              </p>
            </div>
          `;
        }
      }

      // Send email
      await resend.emails.send({
        from: `RentLedger <${process.env.RESEND_FROM_EMAIL ?? "noreply@contact.rentledger.online"}>`,
        to: tenantEmail,
        subject: title,
        html: `
          <div style="font-family:sans-serif; max-width:520px; margin:0 auto; color:#1e293b;">
            <div style="background:#0f172a; padding:20px 24px; border-radius:8px 8px 0 0;">
              <h1 style="margin:0; color:#fff; font-size:1.2rem;">🏠 RentLedger</h1>
            </div>
            <div style="background:#fff; padding:24px; border:1px solid #e2e8f0;
                        border-top:none; border-radius:0 0 8px 8px;">
              <h2 style="margin:0 0 12px; font-size:1.1rem;">${title}</h2>
              <p style="margin:0 0 16px; color:#475569; line-height:1.6;">${message}</p>
              ${invoiceHtml}
              <div style="margin-top:24px; text-align:center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://rentledger.online"}/login"
                   style="display:inline-block; padding:12px 28px; background:#2563eb;
                          color:#fff; border-radius:8px; text-decoration:none; font-weight:600;">
                  View Dashboard
                </a>
              </div>
              <p style="margin-top:24px; font-size:0.75rem; color:#94a3b8; text-align:center;">
                Sent via RentLedger · You are receiving this from your landlord.
              </p>
            </div>
          </div>
        `,
      });
    }
  }

  revalidatePath("/dashboard");
  return { success: true, sent: tenants.length };
}

// ── Mark all notifications read (called from tenant inbox) ───────────────────
export async function markAllRead() {
  const token = (await cookies()).get("session")?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const { payload } = await jwtVerify(token!, secret);
  const userId = payload.userId as string;

  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  revalidatePath("/dashboard");
}
