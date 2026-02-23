"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import db from "@/lib/prisma";
import { use } from "react";

export async function createTenancy(formData: FormData) {
  try {
    // STEP 1: GET LANDLORD ID FROM JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      throw new Error("Unauthorzed");
    }
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    // STEP 2: EXTRACT FORM DATA

    const propertyId = formData.get("propertyId") as string;
    const tenantName = formData.get("tenantName") as string;
    const tenantEmail = formData.get("tenantEmail") as string;
    const tenantPhone = formData.get("tenantPhone") as string;
    const monthlyRent = parseFloat(formData.get("monthlyRent") as string);
    const securityDeposit = parseFloat(
      formData.get("securityDeposit") as string,
    );

    const leastStart = new Date(formData.get("leaseStart") as string);
    const leaseEndInput = formData.get("leaseEnd") as string;
    const leaseEnd = leaseEndInput ? new Date(leaseEndInput) : null;

    // New tenant fields
    const emergencyContact = formData.get("emergencyContact") as string | null;
    const emergencyContactPhone = formData.get("emergencyContactPhone") as
      | string
      | null;
    const idType = formData.get("idType") as string | null;
    const idNumber = formData.get("idNumber") as string | null;
    const dateOfBirthInput = formData.get("dateOfBirth") as string | null;
    const dateOfBirth = dateOfBirthInput ? new Date(dateOfBirthInput) : null;
    const occupation = formData.get("occupation") as string | null;
    const workplace = formData.get("workplace") as string | null;
    const moveInDateInput = formData.get("moveInDate") as string | null;
    const moveInDate = moveInDateInput ? new Date(moveInDateInput) : null;
    const address = formData.get("address") as string | null;

    // STEP 3: VERIFY PROPERTY OWNERSHIP
    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.landlordId !== landlordId) {
      throw new Error("property not found or unauthorized");
    }

    // STEP 4: CHECK FOR EXISTING ACTIVE TENANCY
    const existingTenancy = await db.tenancy.findFirst({
      where: {
        propertyId: propertyId,
        status: "active",
      },
    });
    if (existingTenancy) {
      throw new Error("Property already has an active tenancy");
    }

    // STEP 5: CREATE OR FIND USER
    let user = await db.user.findUnique({
      where: { email: tenantEmail },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: tenantEmail,
          name: tenantName,
          password: null,
        },
      });

      // Create user role
      await db.userRole.create({
        data: {
          userId: user.id,
          role: "tenant",
          landlordId: landlordId,
        },
      });
    }

    const tenant = await db.tenant.upsert({
      where: { userId: user.id },
      update: {
        fullName: tenantName,
        landlordId: landlordId,
        phone: tenantPhone || undefined,
        email: tenantEmail || undefined,
        address: address || undefined,
        emergencyContact: emergencyContact || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        idType: idType || undefined,
        idNumber: idNumber || undefined,
        dateOfBirth: dateOfBirth || undefined,
        occupation: occupation || undefined,
        workplace: workplace || undefined,
        moveInDate: moveInDate || undefined,
      },
      create: {
        userId: user.id,
        landlordId: landlordId,
        fullName: tenantName,
        phone: tenantPhone || null,
        email: tenantEmail || null,
        address: address || null,
        emergencyContact: emergencyContact || null,
        emergencyContactPhone: emergencyContactPhone || null,
        idType: idType || null,
        idNumber: idNumber || null,
        dateOfBirth: dateOfBirth || null,
        occupation: occupation || null,
        workplace: workplace || null,
        moveInDate: moveInDate || null,
      },
    });

    // STEP 7: CREATE TENANCY (THE LEASE)
    const tenancy = await db.tenancy.create({
      data: {
        landlordId: landlordId,
        tenantId: tenant.id,
        propertyId: propertyId,
        leaseStart: leastStart,
        leaseEnd: leaseEnd,
        status: "active",
        monthlyRent: monthlyRent,
        securityDeposit: securityDeposit,
        currency: "INR",
      },
    });

    // STEP 8: UPDATE PROPERTY STATUS

    await db.property.update({
      where: { id: propertyId },
      data: { status: "OCCUPIED" },
    });

    // STEP 9: CREATE ACTIVITY LOG
    await db.activityLog.create({
      data: {
        propertyId: propertyId,
        type: "TENANCY",
        description: `Tenancy started - ${tenantName}`,
        date: new Date(),
        relatedId: tenancy.id,
      },
    });
  } catch (error) {
    console.error("Error creating tenancy:", error);
    throw error;
  }
  // Redirect MUST be outside try-catch
  redirect(`/dashboard/landlord/properties/${formData.get("propertyId")}`);
}
export async function endTenancy(tenancyId: string, propertyId: string) {
  try {
    // Get landlordId from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token!, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    // Verify ownership
    const tenancy = await db.tenancy.findUnique({
      where: { id: tenancyId },
      include: { tenant: true },
    });

    if (!tenancy || tenancy.landlordId !== landlordId) {
      throw new Error("Unauthorized");
    }

    // Update tenancy
    await db.tenancy.update({
      where: { id: tenancyId },
      data: {
        status: "ended",
        endedAt: new Date(),
      },
    });

    // Update property
    await db.property.update({
      where: { id: propertyId },
      data: { status: "VACANT" },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        propertyId: propertyId,
        type: "TENANCY",
        description: `Tenancy ended - ${tenancy.tenant.fullName}`,
        date: new Date(),
        relatedId: tenancyId,
      },
    });
  } catch (error) {
    console.error("Error ending tenancy:", error);
    throw error;
  }

  redirect(`/dashboard/landlord/properties/${propertyId}`);
}

// ─── UPDATE SINGLE TENANT FIELD (inline edit) ───
const DATE_FIELDS = ["dateOfBirth", "moveInDate", "policeVerificationDate"];

export async function updateTenantField(
  tenantId: string,
  fieldName: string,
  fieldValue: string,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return { success: false, error: "Not authenticated" };

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    // Verify tenant belongs to this landlord
    const tenant = await db.tenant.findFirst({
      where: { id: tenantId, landlordId },
    });
    if (!tenant) return { success: false, error: "Tenant not found" };

    // Convert value based on field type
    let processedValue: string | Date | null = fieldValue || null;
    if (DATE_FIELDS.includes(fieldName) && fieldValue) {
      processedValue = new Date(fieldValue);
    }

    await db.tenant.update({
      where: { id: tenantId },
      data: { [fieldName]: processedValue },
    });

    // ── SYNC: If email is being updated, also update User.email ──
    // WHY: User.email is the login credential. Tenant.email is the contact field.
    // If they diverge, the tenant can't login with the email they see on their profile.
    if (fieldName === "email" && fieldValue) {
      await db.user.update({
        where: { id: tenant.userId },
        data: { email: fieldValue },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Update tenant field error:", error);
    return { success: false, error: "Failed to save" };
  }
}
