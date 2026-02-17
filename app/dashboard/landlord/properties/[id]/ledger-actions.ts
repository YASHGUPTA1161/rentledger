"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Adds a new ledger entry (simplified version)
 * - No entry type dropdown
 * - Auto-calculates electricity units from meter readings
 * - Water/Electricity optional (not repeated in payment entries)
 * - Payment proof optional
 *
 * @param formData - Form data from client
 * @returns Success status and entry data
 */
export async function addLedgerEntry(formData: FormData) {
  try {
    // STEP 1: AUTH
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) throw new Error("Unauthorized");

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    // STEP 2: EXTRACT FORM DATA
    const tenancyId = formData.get("tenancyId") as string;
    const description = formData.get("description") as string;

    // Meter reading fields (optional)
    const currentMeterStr = formData.get("electricityCurrentReading");
    const electricityCurrentReading = currentMeterStr
      ? parseInt(currentMeterStr as string)
      : null;
    const rateStr = formData.get("electricityRate");
    const electricityRate = rateStr ? parseFloat(rateStr as string) : null;

    // Other charges (optional)
    const waterStr = formData.get("waterBill");
    const waterBill = waterStr ? parseFloat(waterStr as string) : null;
    const rentStr = formData.get("rentAmount");
    const rentAmount = rentStr ? parseFloat(rentStr as string) : null;

    // Payment fields (optional)
    const creditStr = formData.get("creditAmount");
    const creditAmount = creditStr ? parseFloat(creditStr as string) : null;
    const paymentMethod = formData.get("paymentMethod") as string | null;
    const paymentProof = formData.get("paymentProof") as string | null;

    // STEP 3: GET TENANCY AND VERIFY OWNERSHIP
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: tenancyId },
      include: {
        property: true,
        tenant: true,
      },
    });

    if (!tenancy || tenancy.property.landlordId !== landlordId) {
      throw new Error("Unauthorized");
    }

    // STEP 4: FIND OR CREATE BILL FOR CURRENT MONTH
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Start and end of current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    let bill = await prisma.bill.findFirst({
      where: {
        tenancyId,
        month: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        ledgerEntries: {
          orderBy: { entryDate: "desc" },
        },
      },
    });

    // AUTO-CREATE BILL IF DOESN'T EXIST
    if (!bill) {
      const dueDate = new Date(currentYear, currentMonth + 1, 5); // Due on 5th of next month

      bill = (await prisma.bill.create({
        data: {
          tenancyId,
          propertyId: tenancy.propertyId,
          landlordId,
          tenantId: tenancy.tenantId,
          month: startOfMonth,
          dueDate,
          rent: 0, // Will be calculated from entries
          totalBill: 0,
          paidAmount: 0,
          remainingAmount: 0,
          carryForward: 0,
          status: "pending", // Default status for new bills (PaymentStatus enum)
        },
        include: {
          ledgerEntries: {
            orderBy: { entryDate: "desc" },
          },
        },
      })) as any;
    }

    // At this point, bill is guaranteed to exist
    if (!bill) {
      throw new Error("Failed to create or find bill");
    }

    // STEP 5: CALCULATE METER READING (if provided)
    let electricityPreviousReading = null as number | null;
    let electricityUnitsConsumed = null as number | null;
    let electricityTotal = null as number | null;

    if (electricityCurrentReading !== null && electricityRate !== null) {
      // Find previous meter reading from last bill entry
      const lastBillEntry = bill.ledgerEntries.find(
        (entry) => entry.electricityCurrentReading !== null,
      );
      electricityPreviousReading =
        lastBillEntry?.electricityCurrentReading || 0;
      electricityUnitsConsumed =
        electricityCurrentReading - electricityPreviousReading;
      electricityTotal = electricityUnitsConsumed * electricityRate;
    }

    // STEP 6: CALCULATE DEBIT AMOUNT
    let debitAmount = null as number | null;
    if (
      electricityTotal !== null ||
      waterBill !== null ||
      rentAmount !== null
    ) {
      debitAmount =
        (electricityTotal || 0) + (waterBill || 0) + (rentAmount || 0);
    }

    // STEP 7: CREATE ENTRY
    const entry = await prisma.ledgerEntry.create({
      data: {
        billId: bill.id,
        entryDate: new Date(),
        description,

        // Electricity fields
        electricityPreviousReading,
        electricityCurrentReading,
        electricityUnitsConsumed,
        electricityRate,
        electricityTotal,

        // Other charges
        waterBill,
        rentAmount,

        // Amounts
        debitAmount,
        creditAmount,

        // Payment details
        paymentMethod,
        paymentProof,

        // Metadata
        createdBy: "landlord",
        isEdited: false,
        editedAt: null,
      },
    });

    // STEP 8: RECALCULATE BILL TOTALS
    await recalculateBillTotals(bill.id);

    revalidatePath(`/dashboard/landlord/properties/${tenancy.propertyId}`);
    return { success: true };
  } catch (error) {
    console.error("Add ledger entry error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Recalculates bill totals from all ledger entries
 * Called after add/edit/delete operations
 *
 * @param billId - The bill to recalculate
 */
async function recalculateBillTotals(billId: string) {
  // STEP 1: Get all entries for this bill
  const entries = await prisma.ledgerEntry.findMany({
    where: { billId },
  });

  // STEP 2: Sum debits and credits
  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    if (entry.debitAmount) {
      // Convert Prisma Decimal to number
      totalDebit += entry.debitAmount.toNumber();
    }
    if (entry.creditAmount) {
      totalCredit += entry.creditAmount.toNumber();
    }
  }

  // STEP 3: Calculate totals
  const totalBill = totalDebit; // ✅ Rename to match schema
  const paidAmount = totalCredit; // ✅ keep same
  const remainingAmount = totalDebit - totalCredit; // ✅ keep same

  // STEP 4: Determine status
  let status: "pending" | "paid" | "overdue";
  if (paidAmount === 0) {
    status = "pending"; // Nothing paid yet
  } else if (remainingAmount > 0) {
    status = "pending"; // Partially paid
  } else {
    status = "paid"; // Fully paid
  }

  // STEP 5: Update bill in database
  await prisma.bill.update({
    where: { id: billId },
    data: {
      totalBill: totalDebit, // ✅ Use totalBill instead of totalAmount
      paidAmount: totalCredit,
      remainingAmount: totalDebit - totalCredit,
      status,
    },
  });
}

/**
 * Updates an existing ledger entry
 * Only allows editing within 24 hours if not verified
 *
 * @param formData - Form data with updated values (includes entryId)
 * @returns Success status
 *
 * FLOW:
 *   User clicks Edit → Fields become editable
 *     ↓
 *   User modifies values → Clicks Save
 *     ↓
 *   Form submission calls this function
 *     ↓
 *   Extract entryId from hidden <input name="entryId" />
 *     ↓
 *   Validate: Must be within 24hr AND not verified
 *     ↓
 *   Recalculate electricity (if meter reading changed)
 *     ↓
 *   Update database
 *     ↓
 *   Recalculate bill totals
 *     ↓
 *   Revalidate page → User sees updated entry
 */
export async function updateLedgerEntry(formData: FormData) {
  try {
    // STEP 1: Get landlord ID from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      throw new Error("Not authenticated");
    }

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    // STEP 1.5: Extract entry ID from form data
    // WHY: Hidden input <input name="entryId" value={entry.id} />
    const entryId = formData.get("entryId") as string;
    if (!entryId) {
      throw new Error("Entry ID missing from form data");
    }

    // STEP 2: Fetch entry with relations
    const entry = await prisma.ledgerEntry.findUnique({
      where: { id: entryId },
      include: {
        bill: {
          include: {
            tenancy: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!entry) {
      throw new Error("Entry not found");
    }

    // STEP 3: Verify ownership
    if (entry.bill.tenancy.property.landlordId !== landlordId) {
      throw new Error("Unauthorized");
    }

    // ✅ STEP 4: Check if verified
    if (entry.verifiedByTenant) {
      throw new Error("Cannot edit verified entry - tenant already approved");
    }

    // ✅ STEP 5: Check 24-hour window
    const hoursSinceCreation =
      (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new Error("Edit window expired (24 hours). Cannot modify entry.");
    }

    // STEP 6: Extract updated data (simplified - no entry type)
    const description = formData.get("description") as string;

    // Meter reading fields (optional)
    const currentMeterStr = formData.get("electricityCurrentReading");
    const electricityCurrentReading = currentMeterStr
      ? parseInt(currentMeterStr as string)
      : null;
    const rateStr = formData.get("electricityRate");
    const electricityRate = rateStr ? parseFloat(rateStr as string) : null;

    // Other charges (optional)
    const waterStr = formData.get("waterBill");
    const waterBill = waterStr ? parseFloat(waterStr as string) : null;
    const rentStr = formData.get("rentAmount");
    const rentAmount = rentStr ? parseFloat(rentStr as string) : null;

    // Payment fields (optional)
    const creditStr = formData.get("creditAmount");
    const creditAmount = creditStr ? parseFloat(creditStr as string) : null;
    const paymentMethod = formData.get("paymentMethod") as string | null;
    const paymentProof = formData.get("paymentProof") as string | null;

    // STEP 7: Recalculate meter reading if provided
    let electricityPreviousReading = null as number | null;
    let electricityUnitsConsumed = null as number | null;
    let electricityTotal = null as number | null;

    if (electricityCurrentReading !== null && electricityRate !== null) {
      // Find previous meter reading (excluding current entry)
      const previousEntries = await prisma.ledgerEntry.findMany({
        where: {
          billId: entry.billId,
          id: { not: entryId },
          electricityCurrentReading: { not: null },
        },
        orderBy: { entryDate: "desc" },
        take: 1,
      });

      electricityPreviousReading =
        previousEntries[0]?.electricityCurrentReading || 0;
      electricityUnitsConsumed =
        electricityCurrentReading - electricityPreviousReading;
      electricityTotal = electricityUnitsConsumed * electricityRate;
    }

    // STEP 8: Calculate debit
    let debitAmount = null as number | null;
    if (
      electricityTotal !== null ||
      waterBill !== null ||
      rentAmount !== null
    ) {
      debitAmount =
        (electricityTotal || 0) + (waterBill || 0) + (rentAmount || 0);
    }

    // STEP 9: Update entry
    await prisma.ledgerEntry.update({
      where: { id: entryId },
      data: {
        description,

        // Electricity fields
        electricityPreviousReading,
        electricityCurrentReading,
        electricityUnitsConsumed,
        electricityRate,
        electricityTotal,

        // Other charges
        waterBill,
        rentAmount,

        // Amounts
        debitAmount,
        creditAmount,

        // Payment details
        paymentMethod,
        paymentProof,

        // Edit tracking
        isEdited: true,
        editedAt: new Date(),
      },
    });

    // STEP 10: Recalculate bill totals
    await recalculateBillTotals(entry.billId);

    // STEP 11: Revalidate page
    revalidatePath(
      `/dashboard/landlord/properties/${entry.bill.tenancy.propertyId}`,
    );

    return { success: true };
  } catch (error) {
    console.error("Error updating ledger entry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Deletes a ledger entry
 * Cannot delete verified entries or entries older than 24 hours
 *
 * @param entryId - The entry to delete
 */
export async function deleteLedgerEntry(entryId: string) {
  try {
    // STEP 1: Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token!, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    // STEP 2: Get entry with relations
    const entry = await prisma.ledgerEntry.findUnique({
      where: { id: entryId },
      include: {
        bill: {
          include: {
            tenancy: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!entry) {
      throw new Error("Entry not found");
    }

    // STEP 3: Verify ownership
    if (entry.bill.tenancy.property.landlordId !== landlordId) {
      throw new Error("Unauthorized");
    }

    // STEP 4: Check if verified
    if (entry.verifiedByTenant) {
      throw new Error(
        "Cannot delete verified entries - tenant already approved",
      );
    }

    // ✅ STEP 5: Check 24-hour window
    const hoursSinceCreation =
      (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new Error(
        "Cannot delete entry older than 24 hours. Edit window has expired.",
      );
    }

    const billId = entry.billId;
    const propertyId = entry.bill.tenancy.propertyId;

    // STEP 6: Delete entry
    await prisma.ledgerEntry.delete({
      where: { id: entryId },
    });

    // STEP 7: Recalculate totals
    await recalculateBillTotals(billId);

    // STEP 8: Refresh page
    revalidatePath(`/dashboard/landlord/properties/${propertyId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting ledger entry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
