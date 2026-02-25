// ============================================================
// LEDGER CONSTANTS
// Change ANY label, emoji, or text here — it updates everywhere.
// Intentionally NOT in types.ts so non-devs can find & edit them.
// ============================================================

// ─── Table Column Headers ────────────────────────────────────
export const LEDGER_COLUMNS = {
  checkbox: "☐",
  date: "Date",
  description: "Description",
  currMeter: "Curr Meter",
  rate: "Rate",
  units: "Units",
  electricity: "Elec",
  water: "Water",
  rent: "Rent",
  debit: "Debit",
  credit: "Credit",
  method: "Method",
  proof: "Proof",
  verify: "Verify",
  actions: "Actions",
} as const;

// ─── Button Labels ───────────────────────────────────────────
export const LEDGER_LABELS = {
  addEntry: "+ Add Entry",
  save: "Save",
  cancel: "Cancel",
  saveEdit: "✅ Save",
  cancelEdit: "❌ Cancel",
  edit: "✏️ Edit",
  editDisabled: "✏️ Edit",
  delete: "Delete",
  deleteConfirm: "Delete",
  deleteCancel: "Cancel",
  verify: "✓ Verify",
  verified: "✓ Verified",
  uploading: "Uploading...",
  uploaded: "✅ Uploaded",
  totals: "TOTALS:",
  remaining: "Remaining:",
} as const;

// ─── Payment Method Options ──────────────────────────────────
export const PAYMENT_METHODS = [
  { value: "", label: "-" },
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
] as const;

// ─── Tooltips ────────────────────────────────────────────────
export const LEDGER_TOOLTIPS = {
  editDisabled: "Cannot edit: 24 hours have passed",
  editEnabled: "Edit this entry",
} as const;

// ─── Toast Messages ──────────────────────────────────────────
export const LEDGER_TOASTS = {
  entryAdded: "Entry added",
  entryUpdated: "Entry updated successfully!",
  entryDeleted: "Entry deleted",
  fileUploaded: "File uploaded",
  deleteFailed: "Could not delete entry. Please try again.",
  updateFailed: "Failed to update entry",
  uploadFailed: "Upload failed. Please try again.",
} as const;

// ─── Validation ───────────────────────────────────────────────
export const UPLOAD_VALIDATION = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  validTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ],
  errorType: "Invalid file type. Only images and PDFs allowed.",
  errorSize: "File too large. Maximum size is 10MB.",
} as const;

// ─── Proof link label ────────────────────────────────────────
export const PROOF_LINK_LABEL = "📷 Current";

// ─── Delete confirmation text ────────────────────────────────
export const DELETE_CONFIRM_TEXT = "Delete this entry?";
