"use client";

import { LEDGER_LABELS } from "./constants";
import { formatCurrency } from "@/lib/formatCurrency";
import type { LedgerTotalsProps } from "./types";

export function LedgerTotals({
  entries,
  isLandlord,
  currency = "INR",
}: LedgerTotalsProps) {
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
      <td className="ledger-totals-amount">
        {formatCurrency(totalDebit, currency)}
      </td>
      <td className="ledger-totals-amount">
        {formatCurrency(totalCredit, currency)}
      </td>
      <td colSpan={isLandlord ? 4 : 3} className="ledger-totals-remaining">
        {LEDGER_LABELS.remaining} {formatCurrency(remaining, currency)}
      </td>
    </tr>
  );
}
