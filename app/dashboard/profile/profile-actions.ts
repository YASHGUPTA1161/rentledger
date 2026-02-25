"use server";

import db from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { CURRENCIES } from "@/lib/currencies";
import { revalidatePath } from "next/cache";

// ─── Auth helper ─────────────────────────────────────────────────────────────
async function getLandlord() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) throw new Error("Not authenticated");

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  const userId = payload.userId as string;

  const landlord = await db.landlord.findUnique({ where: { userId } });
  if (!landlord) throw new Error("Landlord not found");
  return landlord;
}

// ─── Update currency ──────────────────────────────────────────────────────────
// Only accepts codes in our CURRENCIES list — rejects anything else.
export async function updateCurrency(code: string) {
  const allowed = CURRENCIES.map((c) => c.code);
  if (!allowed.includes(code)) {
    return { success: false, error: "Invalid currency" };
  }

  try {
    const landlord = await getLandlord();
    await db.landlord.update({
      where: { id: landlord.id },
      data: { defaultCurrency: code },
    });
    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update" };
  }
}
