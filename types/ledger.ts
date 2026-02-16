// This file defines the shape of our ledger data
// It matches the Prisma schema but in TypeScript format

export type EntryType =
  | "BILL" // Regular monthly charge
  | "PAYMENT" // Money received from tenant
  | "CARRY_FWD" // Balance from previous month
  | "ADJUSTMENT" // Correction entry
  | "DISCOUNT" // Discount given to tenant
  | "CREDIT" // Credit for work done by tenant
  | "REFUND" // Money returned to tenant
  | "DAMAGE" // Charge for damage
  | "OTHER"; // Miscellaneous

export type PaymentMethod = "UPI" | "CASH" | "BANK_TRANSFER";

// Shape of a ledger entry (matches Prisma model)
export interface LedgerEntry {
  id: string;
  billId: string;
  entryDate: Date;
  entryType: EntryType;
  description: string;
  debitAmount: number | null; // Prisma Decimal → number
  creditAmount: number | null; // Prisma Decimal → number
  paymentMethod: PaymentMethod | null;
  paymentProof: string | null; // S3 URL
  verifiedByTenant: boolean;
  verifiedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// For creating new entries (excludes auto-generated fields)
export interface CreateLedgerEntry {
  billId: string;
  entryDate: Date;
  entryType: EntryType;
  description: string;
  debitAmount?: number | null;
  creditAmount?: number | null;
  paymentMethod?: PaymentMethod | null;
  paymentProof?: string | null;
  createdBy: string;
}
