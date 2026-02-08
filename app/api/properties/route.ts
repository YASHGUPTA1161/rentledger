// Create & Get All Properties
// POST /api/properties → Create property
// GET /api/properties → Get all properties

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import * as jose from "jose";

export async function GET(request: NextRequest) {
    console.log("GET /api/properties called");
    try {
        const landlordId = await getLandlordIdFromRequest(request);
        
        const properties = await db.property.findMany({
            where: {landlordId},
            orderBy: {createdAt: "desc"},
        });

            console.log(`✅ Found ${properties.length} properties for landlord ${landlordId}`);

    }
}