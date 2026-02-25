"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { PAYMENT_METHODS, UPLOAD_VALIDATION, LEDGER_TOASTS } from "./constants";
import { getCurrencySymbol } from "@/lib/formatCurrency";
import type { NewEntryRowProps } from "./types";

// ─── NewEntryRow ──────────────────────────────────────────────────────────────
//
// WHY THIS SHAPE:
//   Each blank row is completely self-contained — its own state, its own form.
//   The parent (LedgerTable) can mount multiple of these at once.
//   `rowId` is a unique UUID passed by the parent to namespace the HTML form ID
//   so inputs from row-1 never bleed into row-2.
//
// FLOW:
//   Parent clicks "+ Add Entry"
//     → LedgerTable pushes a UUID to pendingRows[]
//       → <NewEntryRow rowId={uuid} .../>  appears in <tbody>
//         → User fills cells inline
//           → Clicks ✓  → onSubmit(formData) → parent saves + removes rowId
//           → Clicks ✗  → onCancel()         → parent removes rowId
//
// ─────────────────────────────────────────────────────────────────────────────

export function NewEntryRow({
  rowId,
  tenancyId,
  currency = "INR",
  previousReading = 0,
  onSubmit,
  onCancel,
}: NewEntryRowProps) {
  const sym = getCurrencySymbol(currency);
  const formId = `new-entry-form-${rowId}`;

  // ── Controlled inputs needed for auto-calculation ──
  const [currentReading, setCurrentReading] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [water, setWater] = useState<number>(0);
  const [rent, setRent] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // S3 proof upload
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  // ── Auto-calculated values ──
  // units = currentReading - previousReading (meter is cumulative)
  // WHY HERE: live preview while the landlord types.
  // Same numbers go into formData on submit — backend stores them.
  const units =
    currentReading > previousReading ? currentReading - previousReading : 0;
  const electricityTotal = units * rate;
  const debitTotal = electricityTotal + water + rent;

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.append("tenancyId", tenancyId);
    onSubmit(formData);
    // parent is responsible for removing this row after success
    setSaving(false);
  };

  // ── Proof upload to S3 ──────────────────────────────────────
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

      const res = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: sanitizedFilename,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          err.details
            ? JSON.stringify(err.details)
            : err.error || "Failed to get upload URL",
        );
      }

      const { presignedUrl, key } = await res.json();
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file to S3");

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
      {/* Checkbox column — also houses the hidden form.
          WHY: <form> can't be a direct child of <tr>, and giving it its own <td>
          shifts every subsequent column right by 1. Nesting it here costs nothing. */}
      <td>
        <form id={formId} onSubmit={handleSubmit} style={{ display: "none" }} />
      </td>

      {/* ── Date ── */}
      <td>
        <input
          type="date"
          name="entryDate"
          form={formId}
          defaultValue={new Date().toISOString().split("T")[0]}
          className="ledger-input"
          autoFocus
          required
        />
      </td>

      {/* ── Description ── */}
      <td>
        <input
          type="text"
          name="description"
          form={formId}
          placeholder="e.g. February rent"
          className="ledger-input"
          required
        />
      </td>

      {/* ── Current Meter ── */}
      <td>
        <input
          type="number"
          name="electricityCurrentReading"
          form={formId}
          placeholder={
            previousReading > 0 ? `prev: ${previousReading}` : "Reading"
          }
          className="ledger-input ledger-input--sm"
          value={currentReading || ""}
          onChange={(e) => setCurrentReading(parseFloat(e.target.value) || 0)}
        />
      </td>

      {/* ── Rate ── */}
      <td>
        <input
          type="number"
          name="electricityRate"
          form={formId}
          placeholder={`${sym}/unit`}
          step="0.01"
          className="ledger-input ledger-input--xs"
          value={rate || ""}
          onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
        />
      </td>

      {/* ── Units — auto-calculated, read-only ── */}
      <td className="ledger-cell--muted">{units > 0 ? `${units}` : "-"}</td>

      {/* ── Electricity Total — auto-calculated ── */}
      <td className="ledger-cell--muted">
        {electricityTotal > 0 ? `${sym}${electricityTotal.toFixed(2)}` : "-"}
      </td>

      {/* ── Water ── */}
      <td>
        <input
          type="number"
          name="waterBill"
          form={formId}
          placeholder={sym}
          step="0.01"
          className="ledger-input ledger-input--sm"
          value={water || ""}
          onChange={(e) => setWater(parseFloat(e.target.value) || 0)}
        />
      </td>

      {/* ── Rent ── */}
      <td>
        <input
          type="number"
          name="rentAmount"
          form={formId}
          placeholder={sym}
          step="0.01"
          className="ledger-input ledger-input--sm"
          value={rent || ""}
          onChange={(e) => setRent(parseFloat(e.target.value) || 0)}
        />
      </td>

      {/* ── Debit Total — auto-calculated ── */}
      <td
        className={
          debitTotal > 0 ? "ledger-cell--total-active" : "ledger-cell--muted"
        }
      >
        {debitTotal > 0 ? `${sym}${debitTotal.toFixed(2)}` : "-"}
      </td>

      {/* ── Credit / Payment received ── */}
      <td>
        <input
          type="number"
          name="creditAmount"
          form={formId}
          placeholder={sym}
          step="0.01"
          className="ledger-input ledger-input--sm"
        />
      </td>

      {/* ── Payment Method ── */}
      <td>
        <select
          name="paymentMethod"
          form={formId}
          className="ledger-input ledger-input--sm"
        >
          {PAYMENT_METHODS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>

      {/* ── Proof Upload ── */}
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
            <span className="ledger-upload-status">Uploading…</span>
          )}
          {uploadedProofUrl && (
            <span className="ledger-upload-success">✅</span>
          )}
          {uploadError && (
            <span className="ledger-upload-error">{uploadError}</span>
          )}
          <input
            type="hidden"
            name="paymentProof"
            form={formId}
            value={uploadedProofUrl}
          />
        </div>
      </td>

      {/* ── Verify — n/a for new rows ── */}
      <td className="ledger-cell--muted">-</td>

      {/* ── Actions: ✓ save, ✗ discard ── */}
      <td>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            type="submit"
            form={formId}
            className="ledger-btn ledger-btn--save"
            disabled={saving || isUploading}
            title="Save entry"
          >
            {saving ? "…" : "✓"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="ledger-btn ledger-btn--cancel"
            title="Discard"
          >
            ✗
          </button>
        </div>
      </td>
    </tr>
  );
}
