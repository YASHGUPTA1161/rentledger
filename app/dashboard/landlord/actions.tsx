"use server";

import db from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";
import { redirect } from "next/navigation";

export async function createProperty(formData: FormData) {
  console.log("🚀 createProperty action started");

  try {
    // Get landlordId from JWT
    const sessionCookie = (await cookies()).get("session")?.value;

    if (!sessionCookie) {
      console.error("❌ No session cookie found");
      throw new Error("Not authenticated - no session cookie");
    }
    console.log("✅ Session cookie found");

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(sessionCookie, secret);
    const landlordId = payload.landlordId as string;

    if (!landlordId) {
      console.error("❌ No landlordId in JWT payload:", payload);
      throw new Error("landlordId missing from JWT");
    }
    console.log("✅ landlordId extracted from JWT:", landlordId);

    // Extract form data
    const address = formData.get("address") as string;
    const description = formData.get("description") as string;

    console.log("📦 Form data:", { address, description });

    // Validate
    if (!address || address.trim() === "") {
      console.error("❌ Address is empty");
      throw new Error("Address is required");
    }

    // Save to database
    console.log("💾 Attempting to save property to database...");
    const property = await db.property.create({
      data: {
        address: address.trim(),
        description: description?.trim() || null,
        landlordId,
      },
    });

    console.log("✅ Property created successfully:", property.id);
  } catch (error) {
    console.error("💥 Error in createProperty:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    throw error;
  }

  console.log("↩️ Redirecting to dashboard...");
  redirect("/dashboard/landlord");
}

export async function updateProperty(formData: FormData) {
  try {
    // 1. EXTRACT: Get data from form
    // IS: Reading hidden input + text fields
    // DOES: Pulls propertyId, new address, new description from form
    // BREAKS: Without this, you have no data to update with
    const propertyId = formData.get("propertyId") as string;
    const address = formData.get("address") as string;
    const description = formData.get("description") as string;

    // 2. AUTH: Get who's making the request
    // IS: JWT verification dance (same as createProperty)
    // DOES: Proves you're logged in and extracts your landlordId
    // BREAKS: Without this, anyone could edit any property!
    const sessionCookie = (await cookies()).get("session")?.value;

    if (!sessionCookie) {
      throw new Error("Not authenticated");
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(sessionCookie, secret);
    const landlordId = payload.landlordId as string;

    if (!landlordId) {
      throw new Error("landlordId missing from JWT");
    }

    // 3. SECURITY CHECK: Do you OWN this property?
    // IS: Database query with TWO filters (id AND landlordId)
    // DOES: Finds property ONLY if you own it
    // BREAKS: Without landlordId filter, you could edit other people's properties!
    const property = await db.property.findFirst({
      where: {
        id: propertyId, // ← Find this specific property
        landlordId: landlordId, // ← BUT only if YOU own it
      },
    });

    if (!property) {
      throw new Error("Property not found or access denied");
    }
    console.log("✅ Ownership verified. Updating property:", propertyId);

    // 4. UPDATE: Actually change the database
    // IS: Prisma update operation
    // DOES: Overwrites old address/description with new values
    // BREAKS: This is the whole point! Without it, nothing saves.
    await db.property.update({
      where: { id: propertyId },
      data: {
        address: address.trim(),
        description: description?.trim() || null,
      },
    });

    console.log("✅ Property updated successfully");
  } catch (error) {
    // IS: Error handler (Safety net)
    // DOES: Catches any failure (DB down, invalid JWT, etc.)
    // BREAKS: Without this, unhandled errors crash the whole app
    console.error("💥 Error in updateProperty:", error);
    throw error;
  }

  // 5. RELOAD: Tell Next.js to refresh the page data
  // IS: Server-side cache invalidation
  // DOES: Forces Next.js to re-fetch properties on next page load
  // BREAKS: Without this, you see OLD data even after updating!
  // NOTE: We DON'T need revalidatePath here because redirect does it

  // 6. REDIRECT: Send user back to dashboard
  // IS: Server-side navigation
  // DOES: Automatically reloads page with fresh data
  // BREAKS: Without this, user stays on same page, sees no changes
  redirect("/dashboard/landlord");
}

export async function deleteProperty(formData: FormData) {
  try {
    const propertyId = formData.get("propertyId") as string;

    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) {
      throw new Error("User not Authenticated");
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(sessionCookie, secret);
    const landlordId = payload.landlordId as string;

    if (!landlordId) {
      throw new Error("landlordId missing from JWT");
    }

    const result = await db.property.deleteMany({
      where: {
        id: propertyId,
        landlordId: landlordId,
      },
    });
    if (result.count === 0) {
      throw new Error("Property not found or access denied.");
    }
    console.log("✅ Property deleted:", propertyId);
  } catch (error) {
    console.error("💥 Error in deleteProperty:", error);
    throw error;
  }
  redirect("/dashboard/landlord");
}
