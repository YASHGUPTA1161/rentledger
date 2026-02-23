import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import db from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TenantTabs } from "./TenantTabs";
import {
  getTenantActivityLogs,
  getTenantDocuments,
  getTenantMaintenanceRequests,
} from "./tenant-actions";

export default async function TenantDashboard() {
  // ── Extract tenantId from JWT ──
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) redirect("/login");

  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const tenantId = payload.tenantId as string;

  if (!tenantId) redirect("/login");

  // ── Fetch tenant profile ──
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) redirect("/login");

  // ── Fetch active tenancy with property ──
  const activeTenancy = await db.tenancy.findFirst({
    where: {
      tenantId,
      status: "active",
    },
    include: {
      property: true,
    },
  });

  if (!activeTenancy) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>🏢 Welcome, {tenant.fullName}</h1>
        <p style={{ color: "#6b7280", marginTop: "2rem" }}>
          No active tenancy found. Please contact your landlord.
        </p>
      </div>
    );
  }

  const propertyId = activeTenancy.propertyId;

  // ── Fetch bills with payments + ledger entries ──
  const bills = await db.bill.findMany({
    where: { tenantId },
    include: {
      payments: true,
      ledgerEntries: {
        orderBy: { entryDate: "asc" },
      },
    },
    orderBy: { month: "desc" },
  });

  // ── Fetch documents, maintenance, activity ──
  const documentsData = await getTenantDocuments(propertyId);
  const maintenanceData = await getTenantMaintenanceRequests(propertyId);
  const logsData = await getTenantActivityLogs(propertyId);

  // ============================================
  // SERIALIZE DATA (Convert Decimal to number)
  // ============================================

  const serializedTenancy = {
    ...activeTenancy,
    monthlyRent: activeTenancy.monthlyRent.toNumber(),
    securityDeposit: activeTenancy.securityDeposit.toNumber(),
  };

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
      electricityPreviousReading: entry.electricityPreviousReading,
      electricityCurrentReading: entry.electricityCurrentReading,
      electricityUnitsConsumed: entry.electricityUnitsConsumed,
      electricityRate: entry.electricityRate?.toNumber() || null,
      electricityTotal: entry.electricityTotal?.toNumber() || null,
      waterBill: entry.waterBill?.toNumber() || null,
      rentAmount: entry.rentAmount?.toNumber() || null,
      debitAmount: entry.debitAmount?.toNumber() || null,
      creditAmount: entry.creditAmount?.toNumber() || null,
      isEdited: entry.isEdited,
      editedAt: entry.editedAt?.toISOString() || null,
      entryDate: entry.entryDate.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      verifiedAt: entry.verifiedAt?.toISOString() || null,
    })),
  }));

  // Serialize maintenance requests
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

  // Serialize activity logs
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

  // Serialize documents
  const serializedDocuments = (documentsData.documents || []).map(
    (doc: Record<string, unknown>) => ({
      ...doc,
      uploadedAt:
        doc.uploadedAt instanceof Date
          ? doc.uploadedAt.toISOString()
          : doc.uploadedAt,
    }),
  );

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🏢 {tenant.fullName}&apos;s Dashboard</h1>
      <p style={{ color: "#6b7280", marginBottom: "0.5rem" }}>
        📍 {activeTenancy.property.address} &mdash; ₹
        {activeTenancy.monthlyRent.toNumber().toLocaleString()}/month
      </p>
      <TenantTabs
        propertyId={propertyId}
        tenancyId={activeTenancy.id}
        tenancy={serializedTenancy}
        bills={serializedBills}
        documents={serializedDocuments}
        maintenanceRequests={serializedMaintenance}
        activityLogs={serializedLogs}
      />
    </div>
  );
}
