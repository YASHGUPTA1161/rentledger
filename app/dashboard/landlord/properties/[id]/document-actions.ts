"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";

interface Document {
  id: string;
  landlordId: string;
  propertyId: string;
  tenantId: string | null;
  billId: string | null;
  tenancyId: string | null;
  documentName: string;
  category: string | null;
  description: string | null;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: Date;
  documentDate: Date | null;
  tenant?: { fullName: string } | null;
  tenancy?: { id: string } | null;
}

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

export async function uploadDocument(formData: FormData): Promise<{
  success: boolean;
  documentId?: string;
  error?: string;
}> {
  try {
    const { landlordId } = await getAuthenticatedUser();

    const propertyId = formData.get("propertyId") as string;
    const tenancyId = formData.get("tenancyId") as string | null;
    const documentName = formData.get("documentName") as string;
    const category = formData.get("category") as string | null;
    const description = formData.get("description") as string | null;
    const fileUrl = formData.get("fileUrl") as string;
    const fileSize = formData.get("fileSize") as string;
    const mimeType = formData.get("mimeType") as string;
    const documentDate = formData.get("documentDate") as string | null;

    const capitalizedName = documentName.toUpperCase();

    const property = await prisma.property.findUnique({
      where: { id: propertyId, landlordId },
    });
    if (!property) return { success: false, error: "Property not found" };

    const document = await prisma.document.create({
      data: {
        landlordId,
        propertyId,
        tenancyId: tenancyId || undefined,
        documentName: capitalizedName,
        category: category || undefined,
        description: description || undefined,
        fileUrl,
        fileSize: parseInt(fileSize),
        mimeType,
        documentDate: documentDate ? new Date(documentDate) : undefined,
      },
    });

    revalidatePath(`/dashboard/landlord/properties/${propertyId}`);
    return { success: true, documentId: document.id };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Failed to upload" };
  }
}

export async function deleteDocument(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { landlordId } = await getAuthenticatedUser();

    const document = await prisma.document.findUnique({
      where: { id: documentId, landlordId },
    });
    if (!document) return { success: false, error: "Not found" };

    await prisma.document.delete({ where: { id: documentId } });
    revalidatePath(`/dashboard/landlord/properties/${document.propertyId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: "Failed to delete" };
  }
}

export async function getDocuments(propertyId: string): Promise<{
  success: boolean;
  documents: Document[];
  error?: string;
}> {
  try {
    const { landlordId } = await getAuthenticatedUser();

    const documents = await prisma.document.findMany({
      where: { propertyId, landlordId },
      include: {
        tenant: { select: { fullName: true } },
        tenancy: { select: { id: true } },
      },
      orderBy: { uploadedAt: "desc" },
    });

    return { success: true, documents };
  } catch (error) {
    console.error("Fetch error:", error);
    return { success: false, error: "Failed to fetch", documents: [] };
  }
}
