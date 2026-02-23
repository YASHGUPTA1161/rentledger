// ============================================================
// LEDGER TYPES
// Single source of truth for all ledger-related types.
// Import from here — never re-define these elsewhere.
// ============================================================

export type PaymentMethod = "UPI" | "CASH" | "BANK_TRANSFER";

// ─── Core Data Shape ───────────────────────────────────────
// Serialized = all Dates converted to ISO strings for safe
// passing from Server Component → Client Component
export interface SerializedLedgerEntry {
  id: string;
  billId: string;
  entryDate: string;
  description: string;

  // Electricity meter
  electricityPreviousReading: number | null;
  electricityCurrentReading: number | null;
  electricityUnitsConsumed: number | null;
  electricityRate: number | null;
  electricityTotal: number | null;

  // Other charges
  waterBill: number | null;
  rentAmount: number | null;

  // Generic amounts
  debitAmount: number | null;
  creditAmount: number | null;

  // Payment
  paymentMethod: string | null;
  paymentProof: string | null;

  // Verification — tenant locks the entry
  verifiedByTenant: boolean;
  verifiedAt: string | null;

  // Edit tracking
  isEdited: boolean;
  editedAt: string | null;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Component Props ────────────────────────────────────────

export interface LedgerTableProps {
  tenancyId: string;
  billId: string;
  entries: SerializedLedgerEntry[];
  isLandlord: boolean;
  onVerify?: (entryId: string) => void;
}

export interface NewEntryRowProps {
  tenancyId: string;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

export interface EntryRowProps {
  entry: SerializedLedgerEntry;
  isLandlord: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  isEditing: boolean;
  canEdit: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (formData: FormData) => void;
  onVerify?: (entryId: string) => void;
}

export interface LedgerTotalsProps {
  entries: SerializedLedgerEntry[];
  isLandlord: boolean;
}
