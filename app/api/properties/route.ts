// Create & Get All Properties
// POST /api/properties → Create property
// GET /api/properties → Get all properties

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import * as jose from "jose";

export async function GET(request: NextRequest) {
  console.log("GET /api/properties called");
  try {
    // Step 1: Get landlordId from JWT
    const landlordId = await getLandlordIdFromRequest(request);

    // Step 2: Query database (filtered by landlordId)
    const properties = await db.property.findMany({
      where: { landlordId },
      orderBy: { createdAt: "desc" },
    });
    console.log(
      `✅ Found ${properties.length} properties for landlord ${landlordId}`,
    );

    // Step 3: Return JSON response
    return NextResponse.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error("Error in GET /api/properties:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch properties" },
      { status: 500 },
    );
  }
}
// POST /api/properties - Create new property
export async function POST(request: NextRequest) {
  console.log("POST /api/properties called");
  try {
    // Step 1: Get landlordId from JWT
    const landlordId = await getLandlordIdFromRequest(request);
    // Step 2: Parse request body
    const body = await request.json();
    const { address, description } = body;

    console.log("📦 Request body:", { address, description });

    // Step 3: Validate
    if (!address || address.trim() === "") {
      console.error("❌ Validation Failed:  Address is required");
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 },
      );
    }
    // Step 4: Save to database
    const property = await db.property.create({
      data: {
        address: address.trim(),
        description: description?.trim() || null,
        landlordId,
      },
    });
    console.log("✅ Property created with ID:", property.id);

    // Step 5: Return created property
    return NextResponse.json(
      { success: true, data: property },
      { status: 201 },
    );
  } catch (error) {
    console.error("💥 POST /api/properties error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create property" },
      { status: 500 },
    );
  }
}

// Helper function to extract landlordId from JWT
async function getLandlordIdFromRequest(request: NextRequest): Promise<string> {
  const sessionCookies = request.cookies.get("session")?.value;
  if (!sessionCookies) {
    console.error("❌ No session cookie found");
    throw new Error("Not authenticated - no session cookie");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jose.jwtVerify(sessionCookies, secret);
  const landlordId = payload.landlordId as string;

  if (!landlordId) {
    console.error("❌ No landlordId in JWT payload:", payload);
    throw new Error("invalid session - landlordId missing from JWT");
  }
  console.log("✅ Authenticated as landlord:", landlordId);
  return landlordId;
}
