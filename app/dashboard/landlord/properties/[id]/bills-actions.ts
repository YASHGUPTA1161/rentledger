"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/prisma";
import { getErrorMessage } from "@/lib/error-handler";

interface ActionResult {
  success: boolean;
  error?: string;
  redirectTo?: "tenancy" | "overview" | "bills";
}

export async function createBill(formData: FormData): Promise<ActionResult> {
  try {
    // Get landlordId from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token!, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    // Extract form data
    const propertyId = formData.get("propertyId") as string;
    const tenancyId = formData.get("tenancyId") as string;
    const month = new Date(formData.get("month") as string);
    const electricityUnits = parseInt(
      formData.get("electricityUnits") as string,
    );
    const electricityRate = parseFloat(
      formData.get("electricityRate") as string,
    );
    const waterBill = parseFloat(formData.get("waterBill") as string);
    const note = formData.get("note") as string;

    // Get tenancy (for rent amount)
    const tenancy = await db.tenancy.findUnique({
      where: { id: tenancyId },
      include: { tenant: true },
    });

    if (!tenancy) {
      return {
        success: false,
        error: "Create tenancy first",
        redirectTo: "tenancy",
      };
    }

    // Calculate carry forward from previous month
    const previousMonth = new Date(month);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const previousBill = await db.bill.findFirst({
      where: {
        tenancyId: tenancyId,
        month: previousMonth,
      },
    });

    const carryForward = previousBill?.remainingAmount || 0;

    // Calculate totals
    const rent = tenancy.monthlyRent;
    const electricityTotal = electricityUnits * electricityRate;
    const totalBill =
      parseFloat(rent.toString()) +
      electricityTotal +
      waterBill +
      parseFloat(carryForward.toString());

    // Create bill
    const bill = await db.bill.create({
      data: {
        landlordId: landlordId,
        tenancyId: tenancyId,
        tenantId: tenancy.tenantId,
        propertyId: propertyId,
        month: month,
        dueDate: new Date(month.getFullYear(), month.getMonth() + 1, 5), // 5th of next month
        rent: rent,
        electricityUnits: electricityUnits,
        electricityRate: electricityRate,
        electricityTotal: electricityTotal,
        waterBill: waterBill,
        carryForward: carryForward,
        totalBill: totalBill,
        paidAmount: 0,
        remainingAmount: totalBill,
        status: "pending",
        currency: tenancy.currency,
        note: note,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        propertyId: propertyId,
        type: "BILL",
        description: `Bill created for ${month.toLocaleString("default", { month: "long", year: "numeric" })} - ₹${totalBill}`,
        date: new Date(),
        relatedId: bill.id,
      },
    });

    // TODO: Send email notification to tenant

    revalidatePath(`/dashboard/landlord/properties/${propertyId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function addPayment(formData: FormData) {
  try {
    // Get landlordId from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token!, JWT_SECRET);
    const landlordId = payload.landlordId as string;

    // Extract form data
    const billId = formData.get("billId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const paidAt = new Date(formData.get("paidAt") as string);
    const paymentMethod = formData.get("paymentMethod") as string;
    const paymentProof = formData.get("paymentProof") as string; // S3 URL
    const note = formData.get("note") as string;

    // Get bill
    const bill = await db.bill.findUnique({
      where: { id: billId },
    });

    if (!bill) throw new Error("Bill not found");

    // Create payment
    const payment = await db.payment.create({
      data: {
        billId: billId,
        amount: amount,
        paidAt: paidAt,
        paymentMethod: paymentMethod,
        paymentProof: paymentProof,
        note: note,
      },
    });

    // Update bill totals
    const newPaidAmount = parseFloat(bill.paidAmount.toString()) + amount;
    const newRemainingAmount =
      parseFloat(bill.totalBill.toString()) - newPaidAmount;

    let newStatus: string;
    if (newRemainingAmount <= 0) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partial";
    } else {
      newStatus = "pending";
    }

    await db.bill.update({
      where: { id: billId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus as any,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        propertyId: bill.propertyId,
        type: "PAYMENT",
        description: `Payment added - ₹${amount}`,
        date: new Date(),
        relatedId: payment.id,
      },
    });

    // TODO: Send email notification to tenant
    // TODO: Generate PDF receipt
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }

  redirect(`/dashboard/landlord/properties/${formData.get("propertyId")}`);
}

export async function verifyPayment(paymentId: string, propertyId: string) {
  try {
    // Get tenantId from JWT (tenant action!)
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token!, JWT_SECRET);
    const tenantId = payload.tenantId as string;

    // Verify payment belongs to this tenant
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { bill: true },
    });

    if (!payment || payment.bill.tenantId !== tenantId) {
      throw new Error("Unauthorized");
    }

    // Mark as verified
    await db.payment.update({
      where: { id: paymentId },
      data: {
        verifiedByTenant: true,
        verifiedAt: new Date(),
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        propertyId: propertyId,
        type: "PAYMENT",
        description: `Payment verified by tenant`,
        date: new Date(),
        relatedId: paymentId,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }

  redirect(`/dashboard/tenant/properties/${propertyId}`);
}
