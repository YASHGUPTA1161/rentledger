"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/app/dashboard/landlord/properties/[id]/activity-actions";

// ─── Auth helper: extracts tenantId from JWT ───
async function getAuthenticatedTenant() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session");

  if (!token) throw new Error("Not authenticated");

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token.value, secret);

  const tenantId = payload.tenantId as string;
  const userId = payload.userId as string;
  if (!tenantId) throw new Error("Not a tenant");

  return { userId, tenantId };
}

// ─── Verify a payment (tenant confirms they received/agree) ───
export async function verifyPayment(paymentId: string) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    // Verify this payment belongs to a bill that belongs to this tenant
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { bill: true },
    });

    if (!payment || payment.bill.tenantId !== tenantId) {
      return { success: false, error: "Payment not found" };
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        verifiedByTenant: true,
        verifiedAt: new Date(),
      },
    });

    await logActivity(
      payment.bill.propertyId,
      "PAYMENT_VERIFIED",
      `Tenant verified payment of ₹${payment.amount.toNumber()}`,
      paymentId,
    );

    revalidatePath("/dashboard/tenant");
    return { success: true };
  } catch (error) {
    console.error("Verify payment error:", error);
    return { success: false, error: "Failed to verify" };
  }
}

// ─── Verify a ledger entry (tenant clicks ✓ on individual entry) ───
export async function verifyLedgerEntry(entryId: string) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    // Scope check: entry → bill → tenancy → must belong to this tenant
    const entry = await prisma.ledgerEntry.findFirst({
      where: {
        id: entryId,
        bill: {
          tenancy: { tenantId },
        },
      },
      include: { bill: true },
    });

    if (!entry) return { success: false, error: "Entry not found" };
    if (entry.verifiedByTenant)
      return { success: false, error: "Already verified" };

    await prisma.ledgerEntry.update({
      where: { id: entryId },
      data: {
        verifiedByTenant: true,
        verifiedAt: new Date(),
      },
    });

    await logActivity(
      entry.bill.propertyId,
      "LEDGER_VERIFIED",
      `Tenant verified ledger entry "${entry.description}"`,
      entryId,
    );

    revalidatePath("/dashboard/tenant");
    return { success: true };
  } catch (error) {
    console.error("Verify ledger entry error:", error);
    return { success: false, error: "Failed to verify" };
  }
}

// ─── Upload a document (tenant can upload their own docs) ───
export async function uploadTenantDocument(formData: FormData) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const propertyId = formData.get("propertyId") as string;
    const documentName = formData.get("documentName") as string;
    const category = formData.get("category") as string | null;
    const description = formData.get("description") as string | null;
    const fileUrl = formData.get("fileUrl") as string;
    const fileSize = formData.get("fileSize") as string;
    const mimeType = formData.get("mimeType") as string;

    if (!documentName || !fileUrl || !propertyId) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify tenant has access to this property via active tenancy
    const tenancy = await prisma.tenancy.findFirst({
      where: { tenantId, propertyId, status: "active" },
    });
    if (!tenancy) return { success: false, error: "No active tenancy" };

    // Get landlordId from tenancy's property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) return { success: false, error: "Property not found" };

    const capitalizedName = documentName.toUpperCase();

    await prisma.document.create({
      data: {
        landlordId: property.landlordId,
        propertyId,
        tenantId,
        tenancyId: tenancy.id,
        documentName: capitalizedName,
        category: category || undefined,
        description: description || undefined,
        fileUrl,
        fileSize: parseInt(fileSize),
        mimeType,
      },
    });

    await logActivity(
      propertyId,
      "DOCUMENT_UPLOADED",
      `Tenant uploaded "${capitalizedName}"`,
    );

    revalidatePath("/dashboard/tenant");
    return { success: true };
  } catch (error) {
    console.error("Tenant upload error:", error);
    return { success: false, error: "Failed to upload" };
  }
}

// ─── Raise a maintenance request ───
export async function raiseMaintenanceRequest(formData: FormData) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const propertyId = formData.get("propertyId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string | null;
    const priority = (formData.get("priority") as string) || "MEDIUM";

    if (!title || !propertyId) {
      return { success: false, error: "Title and property are required" };
    }

    // Verify tenant has access to this property
    const tenancy = await prisma.tenancy.findFirst({
      where: { tenantId, propertyId, status: "active" },
    });
    if (!tenancy) return { success: false, error: "No active tenancy" };

    // Get landlordId from property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) return { success: false, error: "Property not found" };

    await prisma.maintenanceRequest.create({
      data: {
        landlord: { connect: { id: property.landlordId } },
        property: { connect: { id: propertyId } },
        tenant: { connect: { id: tenantId } },
        title: title.trim(),
        description: description?.trim() || "",
        category: category || undefined,
        priority,
      },
    });

    await logActivity(
      propertyId,
      "MAINTENANCE_RAISED",
      `Tenant raised issue "${title.trim()}" (${priority})`,
    );

    revalidatePath("/dashboard/tenant");
    return { success: true };
  } catch (error) {
    console.error("Raise maintenance error:", error);
    return { success: false, error: "Failed to create" };
  }
}

// ─── Get activity logs for tenant's property ───
export async function getTenantActivityLogs(propertyId: string) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    // Verify tenant has access to this property
    const tenancy = await prisma.tenancy.findFirst({
      where: { tenantId, propertyId, status: "active" },
    });
    if (!tenancy) return { success: false, logs: [], error: "No access" };

    const logs = await prisma.activityLog.findMany({
      where: { propertyId },
      orderBy: { date: "desc" },
      take: 50,
    });

    return { success: true, logs };
  } catch (error) {
    console.error("Fetch tenant activity logs error:", error);
    return { success: false, logs: [], error: "Failed to fetch" };
  }
}

// ─── Get documents for tenant ───
export async function getTenantDocuments(propertyId: string) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    // Verify tenant has access
    const tenancy = await prisma.tenancy.findFirst({
      where: { tenantId, propertyId, status: "active" },
    });
    if (!tenancy) return { success: false, documents: [], error: "No access" };

    // Get docs that are: (1) shared with this tenant, OR (2) property-level docs
    const documents = await prisma.document.findMany({
      where: {
        propertyId,
        OR: [
          { tenantId }, // Docs tagged with this tenant
          { tenantId: null }, // Property-level docs (shared with everyone)
        ],
      },
      orderBy: { uploadedAt: "desc" },
    });

    return { success: true, documents };
  } catch (error) {
    console.error("Fetch tenant docs error:", error);
    return { success: false, documents: [], error: "Failed to fetch" };
  }
}

// ─── Get maintenance requests for tenant ───
export async function getTenantMaintenanceRequests(propertyId: string) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const requests = await prisma.maintenanceRequest.findMany({
      where: { propertyId, tenantId },
      orderBy: { requestedAt: "desc" },
    });

    return { success: true, requests };
  } catch (error) {
    console.error("Fetch tenant maintenance error:", error);
    return { success: false, requests: [], error: "Failed to fetch" };
  }
}
