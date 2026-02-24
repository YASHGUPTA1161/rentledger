"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// How long to keep activity logs — change this to adjust retention
const LOG_RETENTION_DAYS = 7;

// ─── Auth helper ───
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session");

  if (!token) throw new Error("Not authenticated");

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token.value, secret);

  const userId = payload.userId as string;
  const landlord = await prisma.landlord.findUnique({ where: { userId } });
  if (!landlord) throw new Error("Landlord not found");

  return { userId, landlordId: landlord.id };
}

// ─── REUSABLE LOGGER — call this from other server actions ───
export async function logActivity(
  propertyId: string,
  type: string,
  description: string,
  relatedId?: string,
) {
  try {
    await prisma.activityLog.create({
      data: {
        property: { connect: { id: propertyId } },
        type,
        description,
        date: new Date(),
        relatedId: relatedId || undefined,
      },
    });
  } catch (error) {
    // Never let logging break the main action
    console.error("Activity log error:", error);
  }
}

// ─── GET logs for a property (with automatic 30-day cleanup) ───
export async function getActivityLogs(propertyId: string) {
  try {
    await getAuthenticatedUser();

    // Auto-prune: silently delete entries older than LOG_RETENTION_DAYS.
    // Runs every time the Activity Log tab is opened — no cron needed.
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - LOG_RETENTION_DAYS);

    await prisma.activityLog.deleteMany({
      where: { propertyId, date: { lt: cutoff } },
    });

    // Fetch remaining logs (already pruned above)
    const logs = await prisma.activityLog.findMany({
      where: { propertyId },
      orderBy: { date: "desc" },
      take: 100,
    });

    return { success: true, logs };
  } catch (error) {
    console.error("Fetch activity logs error:", error);
    return { success: false, logs: [], error: "Failed to fetch" };
  }
}
