import { createProperty } from "./actions";
import { PropertyList } from "./PropertyList";
import db from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";
import RentalBarChart from "./RentalBarChart";

export default async function LandlordDashboard() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const sessionCookie = (await cookies()).get("session")?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jose.jwtVerify(sessionCookie!, secret);
  const landlordId = payload.landlordId as string;

  // ── Properties ────────────────────────────────────────────────────────────
  const properties = await db.property.findMany({
    where: { landlordId },
    orderBy: { createdAt: "desc" },
    select: { id: true, address: true },
  });

  // ── Raw ledger entries — last 24 months ──────────────────────────────────
  // LedgerEntry has the ACTUAL recorded amounts per transaction.
  // Bill.rent etc. can be 0 if the landlord never updated the bill card.
  const twentyFourMonthsAgo = new Date();
  twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 23);
  twentyFourMonthsAgo.setDate(1);
  twentyFourMonthsAgo.setHours(0, 0, 0, 0);

  const ledgerEntries = await db.ledgerEntry.findMany({
    where: {
      bill: { landlordId },
      entryDate: { gte: twentyFourMonthsAgo },
    },
    select: {
      debitAmount: true, // total amount billed in this entry
      creditAmount: true, // amount paid / collected
      rentAmount: true,
      electricityTotal: true,
      waterBill: true,
      bill: {
        select: {
          month: true, // which month this bill belongs to
          propertyId: true,
        },
      },
    },
    orderBy: { entryDate: "asc" },
  });

  // Serialize — Decimal → number, DateTime → ISO string
  const billsForClient = ledgerEntries.map((e) => ({
    propertyId: e.bill.propertyId,
    month: e.bill.month.toISOString(),
    rent: Number(e.rentAmount ?? 0),
    electricity: Number(e.electricityTotal ?? 0),
    water: Number(e.waterBill ?? 0),
    collected: Number(e.creditAmount ?? 0),
  }));

  // ── Currency ──────────────────────────────────────────────────────────────
  const landlord = await db.landlord.findUnique({
    where: { id: landlordId },
    select: { defaultCurrency: true },
  });
  const currency = landlord?.defaultCurrency ?? "INR";

  // ── Fetch all properties for PropertyList (needs full shape) ───────────────
  const propertiesFull = await db.property.findMany({
    where: { landlordId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🏠 Landlord Dashboard</h1>

      {/* ── Revenue Chart ─────────────────────────────────────────────────── */}
      <RentalBarChart
        rawBills={billsForClient}
        properties={properties}
        currency={currency}
      />

      {/* ── Property List ─────────────────────────────────────────────────── */}
      <h2>My Properties ({propertiesFull.length})</h2>
      {propertiesFull.length === 0 ? (
        <p>No Properties yet. Add one below!</p>
      ) : (
        <PropertyList properties={propertiesFull} />
      )}

      {/* ── Add Property Form ─────────────────────────────────────────────── */}
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
