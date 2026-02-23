// ============================================================
// TENANT DASHBOARD CONSTANTS
// Tab names, button labels, emoji — all in one place.
// ============================================================

// ─── Tab Names ───────────────────────────────────────────────
// Change tab order or labels here. The icon + text is here.
export const TENANT_TABS = [
  { id: "bills", label: "💳 Bills & Ledger" },
  { id: "documents", label: "📄 Documents" },
  { id: "maintenance", label: "🔧 Maintenance" },
  { id: "activity", label: "📋 Activity" },
] as const;

// ─── Tab IDs (type-safe) ─────────────────────────────────────
export type TenantTabId = (typeof TENANT_TABS)[number]["id"];

// ─── Button Labels ───────────────────────────────────────────
export const TENANT_LABELS = {
  verify: "✓ Verify Payment",
  verifying: "Verifying...",
  viewLedger: "View Ledger",
  collapseLedger: "Hide Ledger",
  previewBill: "📄 Preview Bill",
  loadingPreview: "Loading...",
  noBills: "No bills yet",
  amount: "₹",
} as const;

// ─── Toast Messages ──────────────────────────────────────────
export const TENANT_TOASTS = {
  verifySuccess: "Payment verified!",
  verifyFailed: "Failed to verify",
  entryVerified: "Entry verified!",
  entryFailed: "Failed to verify entry",
} as const;

// ─── Section Titles ──────────────────────────────────────────
export const TENANT_SECTIONS = {
  bills: "Your Bills",
} as const;
