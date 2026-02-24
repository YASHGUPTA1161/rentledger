"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  addLedgerEntry,
  deleteLedgerEntry,
  updateLedgerEntry,
} from "./ledger-actions";
import { EntryRow } from "./components/ledger/EntryRow";
import { NewEntryRow } from "./components/ledger/NewEntryRow";
import { LedgerTotals } from "./components/ledger/LedgerTotals";
import { LedgerExport } from "./LedgerExport";
import {
  LEDGER_COLUMNS,
  LEDGER_LABELS,
  LEDGER_TOASTS,
  DELETE_CONFIRM_TEXT,
} from "./components/ledger/constants";

// ─── Re-export types so existing importers don't break ───────
// TenantBills.tsx imports SerializedLedgerEntry from this path.
// Keep this re-export here permanently.
export type { SerializedLedgerEntry } from "./components/ledger/types";
export type { LedgerTableProps } from "./components/ledger/types";

import type { SerializedLedgerEntry } from "./components/ledger/types";
import type { LedgerTableProps } from "./components/ledger/types";

// ============================================================
// LedgerTable — thin orchestrator
//
// WHAT THIS DOES:
//   Manages state (which row is editing, which are selected,
//   is-adding) and passes handlers down to sub-components.
//
// WHAT THIS DOESN'T DO:
//   Render individual rows (EntryRow / NewEntryRow handle that)
//   Calculate totals (LedgerTotals handles that)
//   Handle file uploads (row components handle that)
//
// ASCII FLOW:
//   LedgerTable
//   ├── <table>
//   │   ├── <thead>  ← column headers from LEDGER_COLUMNS
//   │   └── <tbody>
//   │       ├── NewEntryRow  (when isAdding=true)
//   │       ├── EntryRow × N (one per entry)
//   │       └── LedgerTotals
//   └── "+ Add Entry" button (landlord only)
// ============================================================

export function LedgerTable({
  tenancyId,
  billId,
  entries,
  isLandlord,
  onVerify,
}: LedgerTableProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  // pendingRows: each string is a UUID for one blank "new entry" row.
  // WHY array not boolean: multiple rows can be open at the same time.
  const [pendingRows, setPendingRows] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ─── Edit guard: 24hr window + not verified ───────────────
  const canEditEntry = (entry: SerializedLedgerEntry): boolean => {
    if (entry.verifiedByTenant) return false;
    const hoursSinceCreation =
      (Date.now() - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 24;
  };

  // ─── Handlers ─────────────────────────────────────────────
  // rowId identifies WHICH blank row submitted — so only that row is removed.
  const handleSubmitNew = async (formData: FormData, rowId: string) => {
    const result = await addLedgerEntry(formData);
    if (result.success) {
      setPendingRows((prev) => prev.filter((id) => id !== rowId));
      toast.success(LEDGER_TOASTS.entryAdded, { position: "bottom-right" });
    } else {
      console.error("Failed to add entry:", result.error);
    }
  };

  const handleCancelRow = (rowId: string) => {
    setPendingRows((prev) => prev.filter((id) => id !== rowId));
  };

  const handleDelete = async (entryId: string) => {
    toast(
      (t) => (
        <div>
          <p className="ledger-delete-confirm-text">{DELETE_CONFIRM_TEXT}</p>
          <div className="ledger-delete-confirm-actions">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const result = await deleteLedgerEntry(entryId);
                if (result.success) {
                  toast.success(LEDGER_TOASTS.entryDeleted, {
                    position: "bottom-right",
                  });
                  router.refresh();
                } else {
                  toast.error(LEDGER_TOASTS.deleteFailed, {
                    position: "bottom-right",
                  });
                }
              }}
              className="ledger-btn ledger-btn--delete-confirm"
            >
              {LEDGER_LABELS.deleteConfirm}
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ledger-btn ledger-btn--cancel"
            >
              {LEDGER_LABELS.deleteCancel}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" },
    );
  };

  const handleSaveEdit = async (formData: FormData) => {
    const result = await updateLedgerEntry(formData);
    if (result.success) {
      toast.success(LEDGER_TOASTS.entryUpdated);
      setEditingId(null);
    } else {
      toast.error(result.error || LEDGER_TOASTS.updateFailed);
    }
  };

  const toggleRowSelection = (entryId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(entryId) ? next.delete(entryId) : next.add(entryId);
      return next;
    });
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="ledger-container">
      <div className="ledger-header">
        <h2>Ledger Entries</h2>
        <div className="ledger-header-actions">
          <LedgerExport
            entries={entries}
            fileName={`Ledger_${billId.slice(0, 8)}`}
          />
          {isLandlord && (
            <button
              onClick={() =>
                setPendingRows((prev) => [...prev, crypto.randomUUID()])
              }
              className="ledger-btn ledger-btn--add"
            >
              {LEDGER_LABELS.addEntry}
            </button>
          )}
        </div>
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            {isLandlord && <th>{LEDGER_COLUMNS.checkbox}</th>}
            <th>{LEDGER_COLUMNS.date}</th>
            <th>{LEDGER_COLUMNS.description}</th>
            <th>{LEDGER_COLUMNS.currMeter}</th>
            <th>{LEDGER_COLUMNS.rate}</th>
            <th>{LEDGER_COLUMNS.units}</th>
            <th>{LEDGER_COLUMNS.electricity}</th>
            <th>{LEDGER_COLUMNS.water}</th>
            <th>{LEDGER_COLUMNS.rent}</th>
            <th>{LEDGER_COLUMNS.debit}</th>
            <th>{LEDGER_COLUMNS.credit}</th>
            <th>{LEDGER_COLUMNS.method}</th>
            <th>{LEDGER_COLUMNS.proof}</th>
            <th>{LEDGER_COLUMNS.verify}</th>
            {isLandlord && <th>{LEDGER_COLUMNS.actions}</th>}
          </tr>
        </thead>
        <tbody>
          {pendingRows.map((rowId) => (
            <NewEntryRow
              key={rowId}
              rowId={rowId}
              tenancyId={tenancyId}
              onSubmit={(formData) => handleSubmitNew(formData, rowId)}
              onCancel={() => handleCancelRow(rowId)}
            />
          ))}

          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              isLandlord={isLandlord}
              isSelected={selectedRows.has(entry.id)}
              onToggleSelect={() => toggleRowSelection(entry.id)}
              onDelete={() => handleDelete(entry.id)}
              isEditing={editingId === entry.id}
              canEdit={canEditEntry(entry)}
              onStartEdit={() => setEditingId(entry.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={handleSaveEdit}
              onVerify={onVerify}
            />
          ))}

          <LedgerTotals entries={entries} isLandlord={isLandlord} />
        </tbody>
      </table>
    </div>
  );
}
