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
