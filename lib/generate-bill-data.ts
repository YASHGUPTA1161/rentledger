import prisma from "@/lib/prisma";

/**
 * BILL DATA STRUCTURE
 * Matches the template's dataKey paths
 */
export interface BillData {
  bill: {
    id: string;
    period: string;
    receiptNumber: string;
    date: string;
  };
  property: {
    address: string;
    description: string | null;
  };
  landlord: {
    name: string;
    email: string;
  };
  tenant: {
    name: string;
    email: string;
    phone: string;
  };
  charges: {
    rent: number;
    electricity: number;
    water: number;
    maintenance: number;
    other: number;
  };
  totals: {
    subtotal: number;
    carryForward: number;
    total: number;
    paid: number;
    remaining: number;
  };
}

/**
 * GENERATE BILL DATA
 * Fetches all data needed to render a bill
 */
export async function generateBillData(billId: string): Promise<BillData> {
  // Fetch bill with all relations
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: {
      property: {
        include: {
          landlord: {
            include: {
              user: true, // Get user for email
            },
          },
        },
      },
      tenancy: {
        include: {
          tenant: {
            include: {
              user: true, // Get user for email
            },
          },
        },
      },
      ledgerEntries: true,
    },
  });

  if (!bill) {
    throw new Error("Bill not found");
  }

  // Calculate charges from ledger entries
  const charges = {
    rent: 0,
    electricity: 0,
    water: 0,
    maintenance: 0,
    other: 0,
  };

  let totalPaid = 0;

  bill.ledgerEntries.forEach((entry) => {
    // Add specific charge amounts
    if (entry.rentAmount) {
      charges.rent += Number(entry.rentAmount);
    }

    if (entry.electricityTotal) {
      charges.electricity += Number(entry.electricityTotal);
    }

    if (entry.waterBill) {
      charges.water += Number(entry.waterBill);
    }

    // Handle debit (charges) vs credit (payments)
    if (entry.debitAmount) {
      // If it's not rent/electricity/water, it's other charges
      if (!entry.rentAmount && !entry.electricityTotal && !entry.waterBill) {
        charges.other += Number(entry.debitAmount);
      }
    }

    if (entry.creditAmount) {
      // Credit = payment
      totalPaid += Number(entry.creditAmount);
    }
  });

  // Calculate totals
  const subtotal =
    charges.rent +
    charges.electricity +
    charges.water +
    charges.maintenance +
    charges.other;

  const carryForward = Number(bill.carryForward) || 0;
  const total = subtotal + carryForward;
  const remaining = total - totalPaid;

  // Format period (e.g., "January 2026")
  const billDate = new Date(bill.month);
  const period = billDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Generate receipt number
  const receiptNumber = `#${bill.id.slice(0, 8).toUpperCase()}`;

  return {
    bill: {
      id: bill.id,
      period,
      receiptNumber,
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    },
    property: {
      address: bill.property.address,
      description: bill.property.description,
    },
    landlord: {
      name: bill.property.landlord?.name || "Landlord",
      email: bill.property.landlord?.user?.email || "",
    },
    tenant: {
      name: bill.tenancy?.tenant.fullName || "Tenant",
      email: bill.tenancy?.tenant.user?.email || "",
      phone: bill.tenancy?.tenant.user?.name || "", // Using name field for phone since no phone in schema
    },
    charges,
    totals: {
      subtotal,
      carryForward,
      total,
      paid: totalPaid,
      remaining,
    },
  };
}
