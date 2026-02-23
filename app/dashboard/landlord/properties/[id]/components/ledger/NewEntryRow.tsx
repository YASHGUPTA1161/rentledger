"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  LEDGER_LABELS,
  PAYMENT_METHODS,
  UPLOAD_VALIDATION,
  LEDGER_TOASTS,
} from "./constants";
import type { NewEntryRowProps } from "./types";

// ─── NewEntryRow ──────────────────────────────────────────────
// Renders the blank input row shown when landlord clicks "+ Add Entry".
// Handles its own S3 upload state independently.
// WHY separate: ~300 lines of form + upload logic that pollutes LedgerTable.
// ─────────────────────────────────────────────────────────────

export function NewEntryRow({
  tenancyId,
  onSubmit,
  onCancel,
}: NewEntryRowProps) {
  const [currentReading, setCurrentReading] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [water, setWater] = useState<number>(0);
  const [rent, setRent] = useState<number>(0);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  const units = currentReading > 0 ? currentReading : 0;
  const electricityTotal = units * rate;
  const total = electricityTotal + water + rent;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("tenancyId", tenancyId);
    onSubmit(formData);
  };

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
      toast.success(LEDGER_TOASTS.fileUploaded, { position: "bottom-right" });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Upload failed");
      toast.error(LEDGER_TOASTS.uploadFailed, { position: "bottom-right" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <tr className="ledger-new-entry-row">
      {/* Hidden form — action is tied to inputs via form="new-entry-form" */}
      <td>
        <form onSubmit={handleSubmit} id="new-entry-form" />
      </td>

      {/* Date */}
      <td>
        <input
          type="date"
          name="entryDate"
          form="new-entry-form"
          defaultValue={new Date().toISOString().split("T")[0]}
          className="ledger-input"
          required
        />
      </td>

      {/* Description */}
      <td>
        <input
          type="text"
          name="description"
          form="new-entry-form"
          placeholder="Description..."
          className="ledger-input"
          required
        />
      </td>

      {/* Current Meter */}
      <td>
        <input
          type="number"
          name="electricityCurrentReading"
          form="new-entry-form"
          placeholder="Current meter"
          className="ledger-input ledger-input--sm"
          value={currentReading || ""}
          onChange={(e) => setCurrentReading(parseFloat(e.target.value) || 0)}
        />
      </td>

      {/* Rate */}
      <td>
        <input
          type="number"
          name="electricityRate"
          form="new-entry-form"
          placeholder="₹/unit"
          step="0.01"
          className="ledger-input ledger-input--xs"
          value={rate || ""}
          onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
        />
      </td>

      {/* Units (auto-calculated, read-only) */}
      <td className="ledger-cell--muted">{units ? `${units} units` : "-"}</td>

      {/* Electricity Total (auto-calculated, read-only) */}
      <td className="ledger-cell--muted">
        {electricityTotal ? `₹${electricityTotal.toFixed(2)}` : "-"}
      </td>

      {/* Water */}
      <td>
        <input
          type="number"
          name="waterBill"
          form="new-entry-form"
          placeholder="Water"
          step="0.01"
          className="ledger-input ledger-input--sm"
          value={water || ""}
          onChange={(e) => setWater(parseFloat(e.target.value) || 0)}
        />
      </td>

      {/* Rent */}
      <td>
        <input
          type="number"
          name="rentAmount"
          form="new-entry-form"
          placeholder="Rent"
          step="0.01"
          className="ledger-input ledger-input--sm"
          value={rent || ""}
          onChange={(e) => setRent(parseFloat(e.target.value) || 0)}
        />
      </td>

      {/* Total Debit (auto-calculated) */}
      <td
        className={
          total > 0 ? "ledger-cell--total-active" : "ledger-cell--muted"
        }
      >
        {total > 0 ? `₹${total.toFixed(2)}` : "-"}
      </td>

      {/* Credit / Payment */}
      <td>
        <input
          type="number"
          name="creditAmount"
          form="new-entry-form"
          placeholder="Payment"
          step="0.01"
          className="ledger-input ledger-input--sm"
        />
      </td>

      {/* Payment Method */}
      <td>
        <select
          name="paymentMethod"
          form="new-entry-form"
          className="ledger-input ledger-input--sm"
        >
          {PAYMENT_METHODS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>

      {/* Proof Upload */}
      <td>
        <div className="ledger-upload-cell">
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
          {uploadedProofUrl && (
            <span className="ledger-upload-success">
              {LEDGER_LABELS.uploaded}
            </span>
          )}
          {uploadError && (
            <span className="ledger-upload-error">{uploadError}</span>
          )}
          <input
            type="hidden"
            name="paymentProof"
            form="new-entry-form"
            value={uploadedProofUrl}
          />
        </div>
      </td>

      {/* Verify — n/a for new row */}
      <td>-</td>

      {/* Actions */}
      <td>
        <button
          type="submit"
          form="new-entry-form"
          className="ledger-btn ledger-btn--save"
        >
          {LEDGER_LABELS.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="ledger-btn ledger-btn--cancel"
        >
          {LEDGER_LABELS.cancel}
        </button>
      </td>
    </tr>
  );
}
