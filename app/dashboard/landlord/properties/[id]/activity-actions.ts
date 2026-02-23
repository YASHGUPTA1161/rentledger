"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

// ─── GET logs for a property ───
export async function getActivityLogs(propertyId: string) {
  try {
    await getAuthenticatedUser();

    const logs = await prisma.activityLog.findMany({
      where: { propertyId },
      orderBy: { date: "desc" },
      take: 50,
    });

    return { success: true, logs };
  } catch (error) {
    console.error("Fetch activity logs error:", error);
    return { success: false, logs: [], error: "Failed to fetch" };
  }
}
