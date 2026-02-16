"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  addLedgerEntry,
  deleteLedgerEntry,
  updateLedgerEntry,
} from "./ledger-actions";

// ============================================
// TYPES
// ============================================

//  TYPE definitions removed - no entry type dropdown in simplified version
type PaymentMethod = "UPI" | "CASH" | "BANK_TRANSFER";

interface SerializedLedgerEntry {
  id: string;
  billId: string;
  entryDate: string; // ISO string from server
  description: string;

  // ✅ NEW: Meter reading fields
  electricityPreviousReading: number | null;
  electricityCurrentReading: number | null;
  electricityUnitsConsumed: number | null;
  electricityRate: number | null;
  electricityTotal: number | null;

  // Other charges (optional)
  waterBill: number | null;
  rentAmount: number | null;

  // Generic amounts
  debitAmount: number | null;
  creditAmount: number | null;

  // Payment details
  paymentMethod: string | null;
  paymentProof: string | null;

  // Verification
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

interface LedgerTableProps {
  billId: string;
  entries: SerializedLedgerEntry[];
  isLandlord: boolean; // Used to show/hide delete button
}

// ============================================
// COMPONENT
// ============================================

export function LedgerTable({ billId, entries, isLandlord }: LedgerTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  // ============================================
  // NEW: EDIT STATE
  // ============================================
  // WHY: Track which entry is currently being edited
  // WHAT: Store entry ID when user clicks edit button
  // HOW: null = no editing, string = editing that entry ID
  const [editingId, setEditingId] = useState<string | null>(null);

  // ============================================
  // VALIDATION: Can entry be edited?
  // ============================================
  /**
   * RULE: Entry can only be edited if:
   * 1. Created within last 24 hours AND
   * 2. Not verified by tenant
   *
   * WHY 24hr limit? Give landlord time to fix mistakes, but prevent
   * changing old entries after tenant has seen them.
   *
   * WHY check verification? Once tenant verifies, it's locked.
   * Like a signed contract - can't change after signature.
   */
  const canEditEntry = (entry: SerializedLedgerEntry): boolean => {
    // Already verified? → Cannot edit (locked)
    if (entry.verifiedByTenant) return false;

    // Calculate time since creation
    const createdAt = new Date(entry.createdAt);
    const now = new Date();
    const hoursSinceCreation =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Can edit if less than 24 hours old
    return hoursSinceCreation < 24;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleAddRow = () => {
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
  };

  const handleSubmitNew = async (formData: FormData) => {
    const result = await addLedgerEntry(formData);
    if (result.success) {
      setIsAdding(false);
    } else {
      alert("Error: " + result.error);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Delete this entry?")) return;

    const result = await deleteLedgerEntry(entryId);
    if (!result.success) {
      alert("Error: " + result.error);
    }
  };

  // ============================================
  // NEW: EDIT HANDLERS
  // ============================================

  /**
   * START EDITING
   * WHY: User clicked edit button
   * WHAT: Set editingId to that entry's ID
   * EFFECT: Row switches from display mode to edit mode
   */
  const handleStartEdit = (entryId: string) => {
    setEditingId(entryId);
  };

  /**
   * CANCEL EDITING
   * WHY: User clicked cancel or pressed Esc
   * WHAT: Clear editingId back to null
   * EFFECT: Row switches back to display mode, discards changes
   */
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  /**
   * SAVE EDITED ENTRY
   * WHY: User clicked save button
   * WHAT: Send form data to server action
   * FLOW:
   *   User clicks Save
   *     ↓
   *   Call updateLedgerEntry() server action
   *     ↓
   *   Server validates 24hr + verification
   *     ↓
   *   Server updates database
   *     ↓
   *   Revalidate page data
   *     ↓
   *   Exit edit mode (setEditingId(null))
   */
  const handleSaveEdit = async (formData: FormData) => {
    const result = await updateLedgerEntry(formData);

    if (result.success) {
      toast.success("Entry updated successfully!");
      setEditingId(null); // Exit edit mode
    } else {
      toast.error(result.error || "Failed to update entry");
    }
  };

  const toggleRowSelection = (entryId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="ledger-table-container">
      <div className="ledger-table-header">
        <h2>Ledger Entries</h2>
        {isLandlord && (
          <button onClick={handleAddRow} className="ledger-add-button">
            + Add Entry
          </button>
        )}
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            {isLandlord && <th>☐</th>}
            <th>Date</th>
            <th>Description</th>
            <th>Curr Meter</th>
            <th>Rate</th>
            <th>Units</th>
            <th>Elec ₹</th>
            <th>Water ₹</th>
            <th>Rent ₹</th>
            <th>Debit (₹)</th>
            <th>Credit (₹)</th>
            <th>Method</th>
            <th>Proof</th>
            <th>Verify</th>
            {isLandlord && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {/* New Entry Row */}
          {isAdding && (
            <NewEntryRow
              billId={billId}
              onSubmit={handleSubmitNew}
              onCancel={handleCancelAdd}
            />
          )}

          {/* Existing Entries */}
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
              onStartEdit={() => handleStartEdit(entry.id)}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
            />
          ))}

          {/* Totals Row */}
          <tr className="totals-row">
            <td
              colSpan={isLandlord ? 4 : 3}
              style={{ textAlign: "right", fontWeight: "bold" }}
            >
              TOTALS:
            </td>
            <td style={{ fontWeight: "bold" }}>
              ₹
              {entries
                .reduce((sum, e) => sum + (e.debitAmount || 0), 0)
                .toLocaleString()}
            </td>
            <td style={{ fontWeight: "bold" }}>
              ₹
              {entries
                .reduce((sum, e) => sum + (e.creditAmount || 0), 0)
                .toLocaleString()}
            </td>
            <td colSpan={isLandlord ? 4 : 3}>
              Remaining: ₹
              {(
                entries.reduce((sum, e) => sum + (e.debitAmount || 0), 0) -
                entries.reduce((sum, e) => sum + (e.creditAmount || 0), 0)
              ).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function NewEntryRow({
  billId,
  onSubmit,
  onCancel,
}: {
  billId: string;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  // STATE: Meter reading fields for real-time calculation
  const [currentReading, setCurrentReading] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [water, setWater] = useState<number>(0);
  const [rent, setRent] = useState<number>(0);

  // CALCULATION: Auto-calculate units and total
  const units = currentReading > 0 ? currentReading : 0; // In real app, subtract previous
  const electricityTotal = units * rate;
  const total = electricityTotal + water + rent;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("billId", billId);
    onSubmit(formData);
  };

  return (
    <tr className="new-entry-row">
      <td>
        <form onSubmit={handleSubmit} id="new-entry-form" />
      </td>
      <td>
        <input
          type="date"
          name="entryDate"
          form="new-entry-form"
          defaultValue={new Date().toISOString().split("T")[0]}
          className="ledger-table-input"
          required
        />
      </td>
      <td>
        <input
          type="text"
          name="description"
          form="new-entry-form"
          placeholder="Description..."
          className="ledger-table-input"
          required
        />
      </td>

      {/* METER READING FIELDS */}
      <td>
        <input
          type="number"
          name="electricityCurrentReading"
          form="new-entry-form"
          placeholder="Current meter"
          className="ledger-table-input"
          value={currentReading || ""}
          onChange={(e) => setCurrentReading(parseFloat(e.target.value) || 0)}
          style={{ width: "100px" }}
        />
      </td>
      <td>
        <input
          type="number"
          name="electricityRate"
          form="new-entry-form"
          placeholder="₹/unit"
          step="0.01"
          className="ledger-table-input"
          value={rate || ""}
          onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
          style={{ width: "80px" }}
        />
      </td>
      <td style={{ color: "#666", fontSize: "0.9em" }}>
        {units ? `${units} units` : "-"}
      </td>
      <td style={{ color: "#666", fontSize: "0.9em" }}>
        {electricityTotal ? `₹${electricityTotal.toFixed(2)}` : "-"}
      </td>

      {/* OTHER CHARGES */}
      <td>
        <input
          type="number"
          name="waterBill"
          form="new-entry-form"
          placeholder="Water"
          step="0.01"
          className="ledger-table-input"
          value={water || ""}
          onChange={(e) => setWater(parseFloat(e.target.value) || 0)}
          style={{ width: "90px" }}
        />
      </td>
      <td>
        <input
          type="number"
          name="rentAmount"
          form="new-entry-form"
          placeholder="Rent"
          step="0.01"
          className="ledger-table-input"
          value={rent || ""}
          onChange={(e) => setRent(parseFloat(e.target.value) || 0)}
          style={{ width: "100px" }}
        />
      </td>

      {/* TOTALS */}
      <td
        style={{
          fontWeight: "bold",
          background: total > 0 ? "#fff3cd" : "transparent",
          color: total > 0 ? "#856404" : "#999",
        }}
      >
        {total > 0 ? `₹${total.toFixed(2)}` : "-"}
      </td>
      <td>
        <input
          type="number"
          name="creditAmount"
          form="new-entry-form"
          placeholder="Payment"
          step="0.01"
          className="ledger-table-input"
          style={{ width: "100px" }}
        />
      </td>

      {/* PAYMENT DETAILS */}
      <td>
        <select
          name="paymentMethod"
          form="new-entry-form"
          className="ledger-table-input"
          style={{ width: "100px" }}
        >
          <option value="">-</option>
          <option value="UPI">UPI</option>
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank</option>
        </select>
      </td>
      <td>
        <input
          type="text"
          name="paymentProof"
          form="new-entry-form"
          placeholder="Proof URL"
          className="ledger-table-input"
          style={{ width: "120px" }}
        />
      </td>
      <td>-</td>
      <td>
        <button
          type="submit"
          form="new-entry-form"
          className="ledger-save-button"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="ledger-cancel-button"
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}

/**
 * ============================================
 * ENTRY ROW COMPONENT
 * ============================================
 *
 * DISPLAY vs EDIT MODE:
 * This component has TWO modes, controlled by `isEditing` prop
 *
 * DISPLAY MODE (isEditing = false):
 *   - Shows read-only data
 *   - Shows "Edit" button (if canEdit = true)
 *   - Shows "Delete" button
 *
 * EDIT MODE (isEditing = true):
 *   - Shows input fields for all editable data
 *   - Shows "Save" and "Cancel" buttons
 *   - Hides "Edit" and "Delete" buttons
 *
 * EDIT VALIDATION:
 *   - canEdit = true → Show enabled edit button
 *   - canEdit = false → Show disabled edit button with tooltip
 *
 * WHY THIS PATTERN?
 *   Like Gmail - click edit, row transforms to form, save or cancel
 */
function EntryRow({
  entry,
  isLandlord,
  isSelected,
  onToggleSelect,
  onDelete,
  isEditing,
  canEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: {
  entry: SerializedLedgerEntry;
  isLandlord: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  // NEW: Edit props
  isEditing: boolean; // Is THIS row currently being edited?
  canEdit: boolean; // Can this row be edited? (24hr + not verified)
  onStartEdit: () => void; // User clicked edit button
  onCancelEdit: () => void; // User clicked cancel button
  onSaveEdit: (formData: FormData) => void; // User clicked save button
}) {
  const isVerified = entry.verifiedByTenant;

  /**
   * EDIT MODE RENDERING
   * WHY: When isEditing is true, show input fields instead of text
   * FLOW:
   *   User clicks Edit button
   *     ↓
   *   isEditing becomes true
   *     ↓
   *   This code block renders
   *     ↓
   *   User sees input fields with current values
   */
  if (isEditing) {
    return (
      <tr className="editing-row">
        {isLandlord && <td>-</td>}

        {/* Editable form wrapped in hidden form element */}
        <td colSpan={14}>
          <form
            id={`edit-form-${entry.id}`}
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              onSaveEdit(formData);
            }}
            style={{ display: "contents" }} // Make form invisible, just wraps inputs
          >
            {/* Hidden field: Entry ID (needed by server action) */}
            <input type="hidden" name="entryId" value={entry.id} />
            <input type="hidden" name="billId" value={entry.billId} />

            {/* Date Input */}
            <td>
              <input
                type="date"
                name="entryDate"
                defaultValue={entry.entryDate.split("T")[0]}
                className="ledger-table-input"
                required
              />
            </td>

            {/* Description Input */}
            <td>
              <input
                type="text"
                name="description"
                defaultValue={entry.description}
                className="ledger-table-input"
                required
              />
            </td>

            {/* Current Meter Reading */}
            <td>
              <input
                type="number"
                name="electricityCurrentReading"
                defaultValue={entry.electricityCurrentReading || ""}
                placeholder="0"
                className="ledger-table-input"
              />
            </td>

            {/* Electricity Rate */}
            <td>
              <input
                type="number"
                name="electricityRate"
                defaultValue={entry.electricityRate || ""}
                step="0.01"
                placeholder="₹0"
                className="ledger-table-input"
              />
            </td>

            {/* Units (read-only, auto-calculated) */}
            <td>{entry.electricityUnitsConsumed || "-"}</td>

            {/* Elec Total (read-only, auto-calculated) */}
            <td>
              {entry.electricityTotal
                ? `₹${entry.electricityTotal.toLocaleString()}`
                : "-"}
            </td>

            {/* Water Bill */}
            <td>
              <input
                type="number"
                name="waterBill"
                defaultValue={entry.waterBill || ""}
                step="0.01"
                placeholder="₹0"
                className="ledger-table-input"
              />
            </td>

            {/* Rent Amount */}
            <td>
              <input
                type="number"
                name="rentAmount"
                defaultValue={entry.rentAmount || ""}
                step="0.01"
                placeholder="₹0"
                className="ledger-table-input"
              />
            </td>

            {/* Debit Amount */}
            <td>
              <input
                type="number"
                name="debitAmount"
                defaultValue={entry.debitAmount || ""}
                step="0.01"
                placeholder="₹0"
                className="ledger-table-input"
              />
            </td>

            {/* Credit Amount */}
            <td>
              <input
                type="number"
                name="creditAmount"
                defaultValue={entry.creditAmount || ""}
                step="0.01"
                placeholder="₹0"
                className="ledger-table-input"
              />
            </td>

            {/* Payment Method Dropdown */}
            <td>
              <select
                name="paymentMethod"
                defaultValue={entry.paymentMethod || ""}
                className="ledger-table-input"
              >
                <option value="">-</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </td>

            {/* Proof (read-only in this phase, Phase 2 will add upload) */}
            <td>
              {entry.paymentProof ? (
                <a
                  href={entry.paymentProof}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📷 View
                </a>
              ) : (
                "-"
              )}
            </td>

            {/* Verified Status (always read-only) */}
            <td>{isVerified ? "✓ Verified" : "-"}</td>

            {/* Action Buttons: Save & Cancel */}
            {isLandlord && (
              <td>
                <button
                  type="submit"
                  form={`edit-form-${entry.id}`}
                  className="ledger-save-button"
                  style={{ marginRight: "4px" }}
                >
                  ✅ Save
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="ledger-cancel-button"
                >
                  ❌ Cancel
                </button>
              </td>
            )}
          </form>
        </td>
      </tr>
    );
  }

  /**
   * DISPLAY MODE RENDERING
   * WHY: Default view - just shows data, no inputs
   * WHEN: isEditing = false
   */
  return (
    <tr className={isVerified ? "verified-row" : ""}>
      {isLandlord && (
        <td>
          {!isVerified && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
            />
          )}
        </td>
      )}
      <td>{new Date(entry.entryDate).toLocaleDateString()}</td>
      <td>{entry.description}</td>

      {/* METER READING FIELDS */}
      <td>{entry.electricityCurrentReading || "-"}</td>
      <td>{entry.electricityRate ? `₹${entry.electricityRate}` : "-"}</td>
      <td>{entry.electricityUnitsConsumed || "-"}</td>
      <td>
        {entry.electricityTotal
          ? `₹${entry.electricityTotal.toLocaleString()}`
          : "-"}
      </td>

      {/* BILL COMPONENTS */}
      <td>{entry.waterBill ? `₹${entry.waterBill.toLocaleString()}` : "-"}</td>
      <td>
        {entry.rentAmount ? `₹${entry.rentAmount.toLocaleString()}` : "-"}
      </td>

      {/* TOTALS */}
      <td>
        {entry.debitAmount ? `₹${entry.debitAmount.toLocaleString()}` : "-"}
      </td>
      <td>
        {entry.creditAmount ? `₹${entry.creditAmount.toLocaleString()}` : "-"}
      </td>
      <td>{entry.paymentMethod || "-"}</td>
      <td>
        {entry.paymentProof ? (
          <a
            href={entry.paymentProof}
            target="_blank"
            rel="noopener noreferrer"
            className="ledger-proof-link"
          >
            📷 View
          </a>
        ) : (
          "-"
        )}
      </td>
      <td>{isVerified ? "✓ Verified" : "-"}</td>

      {/* ACTION BUTTONS */}
      {isLandlord && (
        <td>
          {!isVerified && canEdit && (
            <>
              {/* EDIT BUTTON - Only show if entry can be edited */}
              <button
                onClick={onStartEdit}
                className="ledger-edit-button"
                style={{ marginRight: "4px" }}
                title="Edit this entry"
              >
                ✏️ Edit
              </button>

              {/* DELETE BUTTON */}
              <button onClick={onDelete} className="ledger-delete-button">
                Delete
              </button>
            </>
          )}

          {/* DISABLED EDIT BUTTON - Show when entry cannot be edited */}
          {!isVerified && !canEdit && (
            <>
              <button
                disabled
                className="ledger-edit-button-disabled"
                title="Cannot edit: 24 hours have passed"
                style={{ marginRight: "4px" }}
              >
                ✏️ Edit
              </button>

              {/* DELETE still works even after 24hr */}
              <button onClick={onDelete} className="ledger-delete-button">
                Delete
              </button>
            </>
          )}
        </td>
      )}
    </tr>
  );
}
