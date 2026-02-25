import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import db from "@/lib/prisma";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret));
  } catch {
    redirect("/login");
  }

  const userId = payload.userId as string;

  // ── Fetch landlord ────────────────────────────────────────────────────────
  const landlord = await db.landlord.findUnique({ where: { userId } });

  // Tenants don't have profiles here — send them to their dashboard
  if (!landlord) redirect("/dashboard/tenant");

  return (
    <div className="property-page">
      <h1>👤 Profile</h1>
      <ProfileClient
        name={landlord.name}
        phone={landlord.contactPhone}
        currentCurrency={landlord.defaultCurrency}
      />
    </div>
  );
}
