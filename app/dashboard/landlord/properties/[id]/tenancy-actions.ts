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

    // STEP 6: CREATE OR UPDATE TENANT RECORD
    const tenant = await db.tenant.upsert({
      where: { userId: user.id },
      update: {
        // If tenant exists, update their info
        fullName: tenantName,
        landlordId: landlordId,
      },
      create: {
        // If tenant doesn't exist, create new one
        userId: user.id,
        landlordId: landlordId,
        fullName: tenantName,
        address: null,
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
