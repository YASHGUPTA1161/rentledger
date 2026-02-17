"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { S3FileLink } from "./S3FileLink";
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
  tenancyId: string;
  billId: string;
  entries: SerializedLedgerEntry[];
  isLandlord: boolean; // Used to show/hide delete button
}

// ============================================
// COMPONENT
// ============================================

export function LedgerTable({
  tenancyId,
  billId,
  entries,
  isLandlord,
}: LedgerTableProps) {
  const router = useRouter();
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
      toast.success("Entry added", { position: "bottom-right" });
    } else {
      // Log error for developers, don't show to user
      console.error("Failed to add entry:", result.error);
    }
  };

  const handleDelete = async (entryId: string) => {
    // Use toast for confirmation instead of browser confirm
    const deleteToastId = toast(
      (t) => (
        <div>
          <p style={{ marginBottom: "8px", fontWeight: "500" }}>
            Delete this entry?
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const result = await deleteLedgerEntry(entryId);

                if (result.success) {
                  toast.success("Entry deleted", { position: "bottom-right" });
                  router.refresh();
                } else {
                  console.error("Failed to delete entry:", result.error);
                  toast.error("Could not delete entry. Please try again.", {
                    position: "bottom-right",
                  });
                }
              }}
              style={{
                padding: "6px 12px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      },
    );
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
              tenancyId={tenancyId}
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
  tenancyId,
  onSubmit,
  onCancel,
}: {
  tenancyId: string;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  // STATE: Meter reading fields for real-time calculation
  const [currentReading, setCurrentReading] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [water, setWater] = useState<number>(0);
  const [rent, setRent] = useState<number>(0);

  // STATE: File upload
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  // CALCULATION: Auto-calculate units and total
  const units = currentReading > 0 ? currentReading : 0; // In real app, subtract previous
  const electricityTotal = units * rate;
  const total = electricityTotal + water + rent;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("tenancyId", tenancyId);
    onSubmit(formData);
  };

  // Handle file upload to S3
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid file type. Only images and PDFs allowed.");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      // Sanitize filename to match API validation regex
      const sanitizedFilename = file.name
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, "") // Remove any other special chars
        .substring(0, 200); // Limit length

      // Step 1: Get presigned URL from API
      const response = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: sanitizedFilename,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Upload API error:", error);
        throw new Error(
          error.details
            ? JSON.stringify(error.details)
            : error.error || "Failed to get upload URL",
        );
      }

      const { presignedUrl, key } = await response.json();

      // Step 2: Upload file directly to S3 using presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      // Step 3: Construct the public URL
      const publicUrl = `${process.env.NEXT_PUBLIC_S3_URL || "https://t3.storage.dev"}/${process.env.NEXT_PUBLIC_S3_BUCKET || "rentledger"}/${key}`;
      setUploadedProofUrl(publicUrl);
      toast.success("File uploaded", { position: "bottom-right" });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Upload failed");
      toast.error("Upload failed. Please try again.", {
        position: "bottom-right",
      });
    } finally {
      setIsUploading(false);
    }
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: "120px",
          }}
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
            style={{ fontSize: "0.85em" }}
          />
          {isUploading && (
            <span style={{ fontSize: "0.75em", color: "#666" }}>
              Uploading...
            </span>
          )}
          {uploadedProofUrl && (
            <span style={{ fontSize: "0.75em", color: "green" }}>
              ✅ Uploaded
            </span>
          )}
          {uploadError && (
            <span style={{ fontSize: "0.75em", color: "red" }}>
              {uploadError}
            </span>
          )}

          {/* Hidden input to store S3 URL for form submission */}
          <input
            type="hidden"
            name="paymentProof"
            form="new-entry-form"
            value={uploadedProofUrl}
          />
        </div>
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

  // STATE: File upload for edit mode
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string>(
    entry.paymentProof || "",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

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
    // Manual save handler - collects data without form element
    const handleSave = () => {
      const formData = new FormData();

      // Add entry ID and bill ID
      formData.append("entryId", entry.id);
      formData.append("billId", entry.billId);

      // Collect all input values by name
      const row = document.getElementById(`edit-row-${entry.id}`);
      if (!row) return;

      const inputs = row.querySelectorAll("input, select");
      inputs.forEach((input) => {
        if (
          input instanceof HTMLInputElement ||
          input instanceof HTMLSelectElement
        ) {
          if (input.name && input.value) {
            formData.append(input.name, input.value);
          }
        }
      });

      onSaveEdit(formData);
    };

    // Handle file upload to S3 in edit mode
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        setUploadError("Invalid file type. Only images and PDFs allowed.");
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File too large. Maximum size is 10MB.");
        return;
      }

      setIsUploading(true);
      setUploadError("");

      try {
        // Sanitize filename to match API validation regex
        const sanitizedFilename = file.name
          .replace(/\s+/g, "_") // Replace spaces with underscores
          .replace(/[^a-zA-Z0-9._-]/g, "") // Remove any other special chars
          .substring(0, 200); // Limit length

        // Step 1: Get presigned URL from API
        const response = await fetch("/api/s3/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: sanitizedFilename,
            contentType: file.type,
            size: file.size,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Upload API error:", error);
          throw new Error(
            error.details
              ? JSON.stringify(error.details)
              : error.error || "Failed to get upload URL",
          );
        }

        const { presignedUrl, key } = await response.json();

        // Step 2: Upload file directly to S3 using presigned URL
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to S3");
        }

        // Step 3: Construct the public URL
        const publicUrl = `${process.env.NEXT_PUBLIC_S3_URL || "https://t3.storage.dev"}/${process.env.NEXT_PUBLIC_S3_BUCKET || "rentledger"}/${key}`;
        setUploadedProofUrl(publicUrl);
        toast.success("File uploaded successfully!");
      } catch (error) {
        console.error("Upload error:", error);
        setUploadError(
          error instanceof Error ? error.message : "Upload failed",
        );
        toast.error("Failed to upload file");
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <tr className="editing-row" id={`edit-row-${entry.id}`}>
        {/* Checkbox column */}
        {isLandlord && <td>-</td>}

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

        {/* Units (read-only) */}
        <td>{entry.electricityUnitsConsumed || "-"}</td>

        {/* Elec Total (read-only) */}
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

        {/* Proof - Editable with upload */}
        <td>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "120px",
            }}
          >
            {uploadedProofUrl && (
              <S3FileLink fileUrl={uploadedProofUrl}>📷 Current</S3FileLink>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              disabled={isUploading}
              style={{ fontSize: "0.80em" }}
            />
            {isUploading && (
              <span style={{ fontSize: "0.75em", color: "#666" }}>
                Uploading...
              </span>
            )}
            {uploadError && (
              <span style={{ fontSize: "0.75em", color: "red" }}>
                {uploadError}
              </span>
            )}

            {/* Hidden input to store S3 URL */}
            <input type="hidden" name="paymentProof" value={uploadedProofUrl} />
          </div>
        </td>

        {/* Verified Status */}
        <td>{isVerified ? "✓ Verified" : "-"}</td>

        {/* Action Buttons */}
        {isLandlord && (
          <td>
            <button
              type="button"
              onClick={handleSave}
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
        {entry.paymentProof ? <S3FileLink fileUrl={entry.paymentProof} /> : "-"}
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
