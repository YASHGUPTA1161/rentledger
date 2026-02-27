import { cookies } from "next/headers";
import * as jose from "jose";
import db from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PropertyTabs } from "./PropertyTabs";
import { getDocuments } from "./document-actions";
import { getMaintenanceRequests } from "./maintenance-actions";
import { getActivityLogs } from "./activity-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Get landlordId from JWT
  const sessionCookie = (await cookies()).get("session")?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jose.jwtVerify(sessionCookie!, secret);
  const landlordId = payload.landlordId as string;

  // Fetch property (ensure ownership)
  const property = await db.property.findFirst({
    where: {
      id: id,
      landlordId: landlordId,
    },
  });

  if (!property) {
    redirect("/dashboard/landlord");
  }

  // Fetch landlord defaultCurrency
  const landlord = await db.landlord.findUnique({
    where: { id: landlordId },
    select: { defaultCurrency: true },
  });
  const defaultCurrency = landlord?.defaultCurrency ?? "INR";

  // Fetch active tenancy
  const activeTenancy = await db.tenancy.findFirst({
    where: {
      propertyId: id,
      status: "active",
    },
    include: {
      tenant: true,
    },
  });

  // Fetch bills
  const bills = await db.bill.findMany({
    where: {
      propertyId: id,
      landlordId: landlordId,
    },
    include: {
      payments: true,
      ledgerEntries: {
        orderBy: {
          entryDate: "asc",
        },
      },
    },

    orderBy: { month: "desc" },
  });
  // Fetch documents
  const documentsData = await getDocuments(id);

  // Fetch tenancies for document form
  const tenancies = await db.tenancy.findMany({
    where: { propertyId: id },
    include: { tenant: true },
  });

  // ============================================
  // SERIALIZE DATA (Convert Decimal to number)
  // ============================================

  const serializedTenancy = activeTenancy
    ? {
        ...activeTenancy,
        monthlyRent: activeTenancy.monthlyRent.toNumber(),
        securityDeposit: activeTenancy.securityDeposit.toNumber(),
      }
    : null;

  const serializedBills = bills.map((bill) => ({
    id: bill.id,
    landlordId: bill.landlordId,
    tenancyId: bill.tenancyId,
    tenantId: bill.tenantId,
    propertyId: bill.propertyId,
    month: bill.month,
    dueDate: bill.dueDate,
    status: bill.status,
    note: bill.note,
    currency: bill.currency,
    isEdited: bill.isEdited,
    editedAt: bill.editedAt,
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
    electricityUnits: bill.electricityUnits,

    // Serialize Decimal fields
    totalBill: bill.totalBill.toNumber(),
    paidAmount: bill.paidAmount.toNumber(),
    remainingAmount: bill.remainingAmount.toNumber(),
    rent: bill.rent.toNumber(),
    electricityRate: bill.electricityRate?.toNumber() || null,
    electricityTotal: bill.electricityTotal?.toNumber() || null,
    waterBill: bill.waterBill?.toNumber() || null,
    carryForward: bill.carryForward.toNumber(),

    // Serialize payments
    payments: bill.payments.map((payment) => ({
      id: payment.id,
      billId: payment.billId,
      amount: payment.amount.toNumber(),
      paidAt: payment.paidAt,
      confirmedAt: payment.confirmedAt,
      paymentProof: payment.paymentProof,
      paymentMethod: payment.paymentMethod,
      verifiedByTenant: payment.verifiedByTenant,
      verifiedAt: payment.verifiedAt,
      isCorrection: payment.isCorrection,
      correctionReason: payment.correctionReason,
      originalPaymentId: payment.originalPaymentId,
      note: payment.note,
      createdAt: payment.createdAt,
    })),

    // Serialize ledger entries
    ledgerEntries: bill.ledgerEntries.map((entry) => ({
      id: entry.id,
      billId: entry.billId,
      description: entry.description,
      paymentMethod: entry.paymentMethod,
      paymentProof: entry.paymentProof,
      verifiedByTenant: entry.verifiedByTenant,
      createdBy: entry.createdBy,

      // ✅ NEW: Meter reading fields
      electricityPreviousReading: entry.electricityPreviousReading,
      electricityCurrentReading: entry.electricityCurrentReading,
      electricityUnitsConsumed: entry.electricityUnitsConsumed,
      electricityRate: entry.electricityRate?.toNumber() || null,
      electricityTotal: entry.electricityTotal?.toNumber() || null,

      // Other charges
      waterBill: entry.waterBill?.toNumber() || null,
      rentAmount: entry.rentAmount?.toNumber() || null,

      // Serialize Decimals (generic amounts)
      debitAmount: entry.debitAmount?.toNumber() || null,
      creditAmount: entry.creditAmount?.toNumber() || null,

      // Edit tracking
      isEdited: entry.isEdited,
      editedAt: entry.editedAt?.toISOString() || null,

      // Serialize Dates
      entryDate: entry.entryDate.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      verifiedAt: entry.verifiedAt?.toISOString() || null,
    })),
  }));

  // Serialize tenancies (convert Decimal to number)
  const serializedTenancies = tenancies.map((tenancy) => ({
    id: tenancy.id,
    tenant: {
      id: tenancy.tenant.id,
      fullName: tenancy.tenant.fullName,
    },
    monthlyRent: tenancy.monthlyRent.toNumber(),
    securityDeposit: tenancy.securityDeposit.toNumber(),
  }));

  // Fetch + serialize maintenance requests
  const maintenanceData = await getMaintenanceRequests(id);
  const serializedMaintenance = (maintenanceData.requests || []).map(
    (req: Record<string, unknown>) => ({
      ...req,
      requestedAt:
        req.requestedAt instanceof Date
          ? req.requestedAt.toISOString()
          : req.requestedAt,
      completedAt:
        req.completedAt instanceof Date ? req.completedAt.toISOString() : null,
      createdAt:
        req.createdAt instanceof Date
          ? req.createdAt.toISOString()
          : req.createdAt,
      updatedAt:
        req.updatedAt instanceof Date ? req.updatedAt.toISOString() : null,
    }),
  );

  // Fetch + serialize activity logs
  const logsData = await getActivityLogs(id);
  const serializedLogs = (logsData.logs || []).map(
    (log: Record<string, unknown>) => ({
      ...log,
      date: log.date instanceof Date ? log.date.toISOString() : log.date,
      createdAt:
        log.createdAt instanceof Date
          ? log.createdAt.toISOString()
          : log.createdAt,
    }),
  );

  return (
    <div className="property-page">
      <h1>
        <i
          className="fi fi-sr-marker"
          style={{
            fontSize: "24px",
            marginRight: "8px",
            verticalAlign: "middle",
            color: "#ef4444",
          }}
        ></i>
        {property.address}
      </h1>
      <PropertyTabs
        propertyId={property.id}
        currency={defaultCurrency}
        activeTenancy={serializedTenancy}
        bills={serializedBills}
        documents={documentsData.documents || []}
        tenancies={serializedTenancies}
        maintenanceRequests={serializedMaintenance}
        activityLogs={serializedLogs}
      />
    </div>
  );
}
