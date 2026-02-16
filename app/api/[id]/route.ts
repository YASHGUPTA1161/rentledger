import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import * as jose from "jose";

// GET /api/properties/[id] - Get single property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  console.log(`🔍 GET /api/properties/${params.id}`);

  try {
    const landlordId = await getLandlordIdFromRequest(request);

    // Find property by ID AND landlordId (security!)
    const property = await db.property.findFirst({
      where: {
        id: params.id,
        landlordId, // ← Ensures you can ONLY get YOUR properties
      },
    });

    if (!property) {
      console.log("❌ Property not found or not owned by this landlord");
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    console.log("✅ Property found:", property.address);
    return NextResponse.json({ success: true, data: property });
  } catch (error) {
    console.error("💥 GET /api/properties/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property" },
      { status: 500 },
    );
  }
}

// PUT /api/properties/[id] - Update property
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  console.log(`✏️ PUT /api/properties/${params.id}`);

  try {
    const landlordId = await getLandlordIdFromRequest(request);
    const body = await request.json();
    const { address, description } = body;

    console.log("📦 Update data:", { address, description });

    // First check if property exists AND belongs to this landlord
    const existing = await db.property.findFirst({
      where: { id: params.id, landlordId },
    });

    if (!existing) {
      console.log("❌ Property not found or not owned by this landlord");
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    // Update the property
    const updated = await db.property.update({
      where: { id: params.id },
      data: {
        address: address?.trim() || existing.address,
        description: description?.trim() || existing.description,
      },
    });

    console.log("✅ Property updated:", updated.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("💥 PUT /api/properties/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property" },
      { status: 500 },
    );
  }
}

// DELETE /api/properties/[id] - Delete property
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  console.log(`🗑️ DELETE /api/properties/${params.id}`);

  try {
    const landlordId = await getLandlordIdFromRequest(request);

    // Check if property exists AND belongs to this landlord
    const existing = await db.property.findFirst({
      where: { id: params.id, landlordId },
    });

    if (!existing) {
      console.log("❌ Property not found or not owned by this landlord");
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    // Delete the property
    await db.property.delete({
      where: { id: params.id },
    });

    console.log("✅ Property deleted:", params.id);
    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("💥 DELETE /api/properties/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete property" },
      { status: 500 },
    );
  }
}

// Same helper function as route.ts
async function getLandlordIdFromRequest(request: NextRequest): Promise<string> {
  const sessionCookie = request.cookies.get("session")?.value;

  if (!sessionCookie) {
    throw new Error("Not authenticated");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jose.jwtVerify(sessionCookie, secret);
  const landlordId = payload.landlordId as string;

  if (!landlordId) {
    throw new Error("Invalid session");
  }

  return landlordId;
}
