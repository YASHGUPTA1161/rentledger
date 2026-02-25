"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { S3FileLink } from "../../S3FileLink";
import {
  LEDGER_LABELS,
  LEDGER_TOOLTIPS,
  PAYMENT_METHODS,
  UPLOAD_VALIDATION,
  LEDGER_TOASTS,
  PROOF_LINK_LABEL,
} from "./constants";
import { formatCurrency } from "@/lib/formatCurrency";
import type { EntryRowProps } from "./types";

// ─── EntryRow ─────────────────────────────────────────────────
// Two render modes:
//   isEditing=false → read-only cells + Edit/Delete buttons
//   isEditing=true  → input fields + Save/Cancel buttons
//
// WHY separate from LedgerTable: EntryRow alone was ~500 lines.
// LedgerTable is now a thin orchestrator.
// ─────────────────────────────────────────────────────────────

export function EntryRow({
  entry,
  isLandlord,
  isSelected,
  currency = "INR",
  onToggleSelect,
  onDelete,
  isEditing,
  canEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onVerify,
}: EntryRowProps) {
  const isVerified = entry.verifiedByTenant;
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string>(
    entry.paymentProof || "",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  // ─── File upload (used in edit mode) ─────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !UPLOAD_VALIDATION.validTypes.includes(
        file.type as (typeof UPLOAD_VALIDATION.validTypes)[number],
      )
    ) {
      setUploadError(UPLOAD_VALIDATION.errorType);
      return;
    }
    if (file.size > UPLOAD_VALIDATION.maxSizeBytes) {
      setUploadError(UPLOAD_VALIDATION.errorSize);
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const sanitizedFilename = file.name
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .substring(0, 200);

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
        throw new Error(
          error.details
            ? JSON.stringify(error.details)
            : error.error || "Failed to get upload URL",
        );
      }

      const { presignedUrl, key } = await response.json();
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload file to S3");

      const publicUrl = `${process.env.NEXT_PUBLIC_S3_URL || "https://t3.storage.dev"}/${process.env.NEXT_PUBLIC_S3_BUCKET || "rentledger"}/${key}`;
      setUploadedProofUrl(publicUrl);
      toast.success(LEDGER_TOASTS.fileUploaded);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      toast.error(LEDGER_TOASTS.uploadFailed);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Verify status cell (shared by both modes) ────────────
  const VerifyCell = () => {
    if (isVerified) {
      return <span className="ledger-verified">{LEDGER_LABELS.verified}</span>;
    }
    if (!isLandlord && onVerify) {
      return (
        <button
          onClick={() => onVerify(entry.id)}
          className="ledger-btn ledger-btn--verify"
        >
          {LEDGER_LABELS.verify}
        </button>
      );
    }
    return <span className="ledger-cell--muted">-</span>;
  };

  // ═══ EDIT MODE ══════════════════════════════════════════════
  if (isEditing) {
    const handleSave = () => {
      const formData = new FormData();
      formData.append("entryId", entry.id);
      formData.append("billId", entry.billId);

      const row = document.getElementById(`edit-row-${entry.id}`);
      if (!row) return;

      row.querySelectorAll("input, select").forEach((input) => {
        if (
          (input instanceof HTMLInputElement ||
            input instanceof HTMLSelectElement) &&
          input.name &&
          input.value
        ) {
          formData.append(input.name, input.value);
        }
      });

      onSaveEdit(formData);
    };

    return (
      <tr className="ledger-editing-row" id={`edit-row-${entry.id}`}>
        {isLandlord && <td>-</td>}

        <td>
          <input
            type="date"
            name="entryDate"
            defaultValue={entry.entryDate.split("T")[0]}
            className="ledger-input"
            required
          />
        </td>
        <td>
          <input
            type="text"
            name="description"
            defaultValue={entry.description}
            className="ledger-input"
            required
          />
        </td>
        <td>
          <input
            type="number"
            name="electricityCurrentReading"
            defaultValue={entry.electricityCurrentReading || ""}
            placeholder="0"
            className="ledger-input"
          />
        </td>
        <td>
          <input
            type="number"
            name="electricityRate"
            defaultValue={entry.electricityRate || ""}
            step="0.01"
            placeholder="0"
            className="ledger-input"
          />
        </td>
        <td>{entry.electricityUnitsConsumed || "-"}</td>
        <td>
          {entry.electricityTotal
            ? formatCurrency(entry.electricityTotal, currency)
            : "-"}
        </td>
        <td>
          <input
            type="number"
            name="waterBill"
            defaultValue={entry.waterBill || ""}
            step="0.01"
            placeholder="0"
            className="ledger-input"
          />
        </td>
        <td>
          <input
            type="number"
            name="rentAmount"
            defaultValue={entry.rentAmount || ""}
            step="0.01"
            placeholder="0"
            className="ledger-input"
          />
        </td>
        <td>
          <input
            type="number"
            name="debitAmount"
            defaultValue={entry.debitAmount || ""}
            step="0.01"
            placeholder="0"
            className="ledger-input"
          />
        </td>
        <td>
          <input
            type="number"
            name="creditAmount"
            defaultValue={entry.creditAmount || ""}
            step="0.01"
            placeholder="0"
            className="ledger-input"
          />
        </td>
        <td>
          <select
            name="paymentMethod"
            defaultValue={entry.paymentMethod || ""}
            className="ledger-input"
          >
            {PAYMENT_METHODS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </td>

        {/* Proof upload */}
        <td>
          <div className="ledger-upload-cell">
            {uploadedProofUrl && (
              <S3FileLink fileUrl={uploadedProofUrl}>
                {PROOF_LINK_LABEL}
              </S3FileLink>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="ledger-file-input"
            />
            {isUploading && (
              <span className="ledger-upload-status">
                {LEDGER_LABELS.uploading}
              </span>
            )}
            {uploadError && (
              <span className="ledger-upload-error">{uploadError}</span>
            )}
            <input type="hidden" name="paymentProof" value={uploadedProofUrl} />
          </div>
        </td>

        <td>
          <VerifyCell />
        </td>

        {isLandlord && (
          <td>
            <button
              type="button"
              onClick={handleSave}
              className="ledger-btn ledger-btn--save"
            >
              {LEDGER_LABELS.saveEdit}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="ledger-btn ledger-btn--cancel"
            >
              {LEDGER_LABELS.cancelEdit}
            </button>
          </td>
        )}
      </tr>
    );
  }

  // ═══ DISPLAY MODE ═══════════════════════════════════════════
  return (
    <tr
      className={isVerified ? "ledger-row ledger-row--verified" : "ledger-row"}
    >
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
      <td>{entry.electricityCurrentReading || "-"}</td>
      <td>
        {entry.electricityRate
          ? formatCurrency(entry.electricityRate, currency)
          : "-"}
      </td>
      <td>{entry.electricityUnitsConsumed || "-"}</td>
      <td>
        {entry.electricityTotal
          ? formatCurrency(entry.electricityTotal, currency)
          : "-"}
      </td>
      <td>
        {entry.waterBill ? formatCurrency(entry.waterBill, currency) : "-"}
      </td>
      <td>
        {entry.rentAmount ? formatCurrency(entry.rentAmount, currency) : "-"}
      </td>
      <td>
        {entry.debitAmount ? formatCurrency(entry.debitAmount, currency) : "-"}
      </td>
      <td>
        {entry.creditAmount
          ? formatCurrency(entry.creditAmount, currency)
          : "-"}
      </td>
      <td>{entry.paymentMethod || "-"}</td>
      <td>
        {entry.paymentProof ? <S3FileLink fileUrl={entry.paymentProof} /> : "-"}
      </td>
      <td>
        <VerifyCell />
      </td>

      {isLandlord && (
        <td>
          {!isVerified && canEdit && (
            <>
              <button
                onClick={onStartEdit}
                className="ledger-btn ledger-btn--edit"
                title={LEDGER_TOOLTIPS.editEnabled}
              >
                {LEDGER_LABELS.edit}
              </button>
              <button
                onClick={onDelete}
                className="ledger-btn ledger-btn--delete"
              >
                {LEDGER_LABELS.delete}
              </button>
            </>
          )}
          {!isVerified && !canEdit && (
            <>
              <button
                disabled
                className="ledger-btn ledger-btn--edit-disabled"
                title={LEDGER_TOOLTIPS.editDisabled}
              >
                {LEDGER_LABELS.editDisabled}
              </button>
              <button
                onClick={onDelete}
                className="ledger-btn ledger-btn--delete"
              >
                {LEDGER_LABELS.delete}
              </button>
            </>
          )}
        </td>
      )}
    </tr>
  );
}
