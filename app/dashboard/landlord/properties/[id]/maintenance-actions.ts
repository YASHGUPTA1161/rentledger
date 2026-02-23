"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity-actions";

// ─── Auth helper (same pattern as document-actions) ───
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

// ─── GET all requests for a property ───
export async function getMaintenanceRequests(propertyId: string) {
  try {
    const { landlordId } = await getAuthenticatedUser();

    const requests = await prisma.maintenanceRequest.findMany({
      where: { propertyId, landlordId },
      include: {
        tenant: { select: { fullName: true } },
      },
      orderBy: { requestedAt: "desc" },
    });

    return { success: true, requests };
  } catch (error) {
    console.error("Fetch maintenance error:", error);
    return { success: false, requests: [], error: "Failed to fetch" };
  }
}

// ─── CREATE a new request ───
export async function createMaintenanceRequest(formData: FormData) {
  try {
    const { landlordId } = await getAuthenticatedUser();

    const propertyId = formData.get("propertyId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string | null;
    const priority = (formData.get("priority") as string) || "MEDIUM";

    if (!title || !propertyId) {
      return { success: false, error: "Title and property are required" };
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId, landlordId },
    });
    if (!property) return { success: false, error: "Property not found" };

    // ✅ FIXED — relation connect pattern
    await prisma.maintenanceRequest.create({
      data: {
        landlord: { connect: { id: landlordId } },
        property: { connect: { id: propertyId } },
        title: title.trim(),
        description: description?.trim() || "",
        category: category || undefined,
        priority,
      },
    });

    await logActivity(
      propertyId,
      "MAINTENANCE_RAISED",
      `Issue "${title.trim()}" raised (${priority})`,
    );

    revalidatePath(`/dashboard/landlord/properties/${propertyId}`);
    return { success: true };
  } catch (error) {
    console.error("Create maintenance error:", error);
    return { success: false, error: "Failed to create" };
  }
}

// ─── UPDATE status ───
export async function updateMaintenanceStatus(
  requestId: string,
  newStatus: string,
  resolutionNotes?: string,
) {
  try {
    const { landlordId } = await getAuthenticatedUser();

    // ✅ FIXED — findFirst for non-unique compound lookup
    const request = await prisma.maintenanceRequest.findFirst({
      where: { id: requestId, landlordId },
    });
    if (!request) return { success: false, error: "Not found" };

    await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus as
          | "requested"
          | "in_progress"
          | "completed"
          | "cancelled",
        resolutionNotes: resolutionNotes || undefined,
        completedAt: newStatus === "completed" ? new Date() : undefined,
      },
    });

    const statusLabel = newStatus.replace("_", " ").toUpperCase();
    const logType =
      newStatus === "completed"
        ? "MAINTENANCE_COMPLETED"
        : "MAINTENANCE_UPDATED";
    await logActivity(
      request.propertyId,
      logType,
      `Issue "${request.title}" → ${statusLabel}`,
      requestId,
    );

    revalidatePath(`/dashboard/landlord/properties/${request.propertyId}`);
    return { success: true };
  } catch (error) {
    console.error("Update status error:", error);
    return { success: false, error: "Failed to update" };
  }
}

// ─── DELETE a request ───
export async function deleteMaintenanceRequest(requestId: string) {
  try {
    const { landlordId } = await getAuthenticatedUser();

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId, landlordId },
    });
    if (!request) return { success: false, error: "Not found" };

    await prisma.maintenanceRequest.delete({ where: { id: requestId } });

    await logActivity(
      request.propertyId,
      "MAINTENANCE_DELETED",
      `Issue "${request.title}" deleted`,
      requestId,
    );

    revalidatePath(`/dashboard/landlord/properties/${request.propertyId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete maintenance error:", error);
    return { success: false, error: "Failed to delete" };
  }
}
