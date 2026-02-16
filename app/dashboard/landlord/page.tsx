import { createProperty } from "./actions";
import { PropertyList } from "./PropertyList";
import db from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";

export default async function LandlordDashboard() {
  // Get landlordId from JWT
  const sessionCookie = (await cookies()).get("session")?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jose.jwtVerify(sessionCookie!, secret);
  const landlordId = payload.landlordId as string;

  // Fetch THIS landlord's properties only
  const properties = await db.property.findMany({
    where: { landlordId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🏠 Landlord Dashboard</h1>
      {/* Property List */}
      <h2>My Properties({properties.length})</h2>
      {properties.length === 0 ? (
        <p>No Properties yet. Add one below!</p>
      ) : (
        <PropertyList properties={properties} />
      )}
      {/* Add Property Form */}

      <h2>Add New Property</h2>
      <form
        action={createProperty}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "500px",
        }}
      >
        <div>
          <label htmlFor="address">
            Property Address (include city, state):
          </label>
          <input
            type="text"
            id="address"
            name="address"
            placeholder="123 Main St, Apt 2B, New York, NY 10001"
            style={{ width: "100%", padding: "8px" }}
            required
          />
        </div>

        <div>
          <label htmlFor="description">Notes (optional):</label>
          <textarea
            id="description"
            name="description"
            placeholder="2nd floor corner unit, near subway"
            style={{ width: "100%", padding: "8px", minHeight: "80px" }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "10px",
            background: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add Property
        </button>
      </form>
    </div>
  );
}
