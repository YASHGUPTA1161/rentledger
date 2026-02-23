"use client";

import { LEDGER_LABELS, LEDGER_COLUMNS } from "./constants";
import type { LedgerTotalsProps } from "./types";

// ─── LedgerTotals ────────────────────────────────────────────
// WHY separate: The totals row has its own calculation logic.
// Keeping it here means LedgerTable stays a pure orchestrator.
// ─────────────────────────────────────────────────────────────

export function LedgerTotals({ entries, isLandlord }: LedgerTotalsProps) {
  const totalDebit = entries.reduce((sum, e) => sum + (e.debitAmount || 0), 0);
  const totalCredit = entries.reduce(
    (sum, e) => sum + (e.creditAmount || 0),
    0,
  );
  const remaining = totalDebit - totalCredit;

  return (
    <tr className="ledger-totals-row">
      <td colSpan={isLandlord ? 4 : 3} className="ledger-totals-label">
        {LEDGER_LABELS.totals}
      </td>
      <td className="ledger-totals-amount">₹{totalDebit.toLocaleString()}</td>
      <td className="ledger-totals-amount">₹{totalCredit.toLocaleString()}</td>
      <td colSpan={isLandlord ? 4 : 3} className="ledger-totals-remaining">
        {LEDGER_LABELS.remaining}
        {remaining.toLocaleString()}
      </td>
    </tr>
  );
}
