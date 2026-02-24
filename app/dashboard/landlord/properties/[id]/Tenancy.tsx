"use client";

import { useState, useRef } from "react";
import {
  createTenancy,
  endTenancy,
  updateTenantField,
} from "./tenancy-actions";
import { uploadDocument } from "./document-actions";
import toast from "react-hot-toast";
import { sendInvite, generateInviteLink } from "./invite-actions";

// ─── Types ───

interface TenancyProps {
  propertyId: string;
  activeTenancy?: any;
}

// ─── Shared Styles ───

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  padding: "20px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#374151",
  margin: "0 0 12px 0",
  paddingBottom: "4px",
  borderBottom: "1px solid #f3f4f6",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "0.875rem",
  outline: "none",
};

// ─── Helpers ───

function toInputDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── INLINE EDITABLE FIELD ───
// Click to edit → blur/enter to auto-save
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function InlineField({
  label,
  value,
  fieldName,
  tenantId,
  type = "text",
  options,
}: {
  label: string;
  value: string | null | undefined;
  fieldName: string;
  tenantId: string;
  type?: "text" | "tel" | "email" | "date" | "select";
  options?: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localValue, setLocalValue] = useState(value || "");
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const displayValue = type === "date" ? formatDate(value) : value || "—";

  async function save(newValue: string) {
    // Don't save if unchanged
    if (newValue === (value || "")) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const result = await updateTenantField(tenantId, fieldName, newValue);
    setSaving(false);

    if (result.success) {
      toast.success(`${label} updated`);
      setLocalValue(newValue);
    } else {
      toast.error(result.error || "Failed to save");
      setLocalValue(value || "");
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setLocalValue(value || "");
      setEditing(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 500,
    color: "#9ca3af",
    marginBottom: "2px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  if (editing) {
    if (type === "select" && options) {
      return (
        <div>
          <span style={labelStyle}>{label}</span>
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            autoFocus
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value);
              save(e.target.value);
            }}
            onBlur={() => save(localValue)}
            style={{ ...inputStyle, cursor: "pointer" }}
            disabled={saving}
          >
            <option value="">Select</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div>
        <span style={labelStyle}>{label}</span>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          autoFocus
          type={type}
          value={type === "date" ? toInputDate(localValue) : localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          disabled={saving}
        />
      </div>
    );
  }

  // View mode — click to edit
  return (
    <div
      onClick={() => {
        setLocalValue(value || "");
        setEditing(true);
      }}
      style={{ cursor: "pointer" }}
      title="Click to edit"
    >
      <span style={labelStyle}>{label}</span>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: "0.875rem",
          color: (value || "").length > 0 ? "#111827" : "#d1d5db",
          fontWeight: 500,
          padding: "4px 0",
          borderBottom: "1px dashed transparent",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderBottomColor = "#d1d5db")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderBottomColor = "transparent")
        }
      >
        {saving ? "Saving..." : displayValue}
      </p>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MAIN TENANCY COMPONENT ───
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function Tenancy({ propertyId, activeTenancy }: TenancyProps) {
  const [showForm, setShowForm] = useState(false);
  const tenant = activeTenancy?.tenant;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
        Tenancy
      </h2>

      {activeTenancy ? (
        <>
          {/* ── ACTIVE TENANCY HEADER ── */}
          <div
            style={{
              ...cardStyle,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
                🟢 Active Tenancy — {tenant?.fullName}
              </h3>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                }}
              >
                {formatDate(activeTenancy.leaseStart)} –{" "}
                {activeTenancy.leaseEnd
                  ? formatDate(activeTenancy.leaseEnd)
                  : "Ongoing"}
              </p>
            </div>
            <form
              action={async () => {
                await endTenancy(activeTenancy.id, propertyId);
              }}
            >
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#dc2626",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                End Tenancy
              </button>
              {/* ── Send Invite Button ── */}
              <button
                type="button"
                onClick={async () => {
                  const result = await sendInvite(tenant.id, propertyId);
                  if (result.success) {
                    toast.success("Invitation sent to " + result.email);
                  } else {
                    toast.error(result.error || "Failed to send invite");
                  }
                }}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#16a34a",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  marginRight: "8px",
                }}
              >
                📧 Send Invite
              </button>
              {/* ── Copy Invite Link Button ── */}
              <button
                type="button"
                onClick={async () => {
                  const result = await generateInviteLink(
                    tenant.id,
                    propertyId,
                  );
                  if (result.success && result.link) {
                    await navigator.clipboard.writeText(result.link);
                    toast.success("Invite link copied to clipboard!");
                  } else {
                    toast.error(result.error || "Failed to generate link");
                  }
                }}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                🔗 Copy Link
              </button>
            </form>
          </div>

          {/* ── FINANCIAL (read-only, set at creation) ── */}
          <div style={cardStyle}>
            <h4 style={sectionTitle}>💰 Financial Details</h4>
            <div style={gridStyle}>
              <div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Monthly Rent
                </span>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  ₹{activeTenancy.monthlyRent?.toLocaleString()}
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Security Deposit
                </span>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  ₹{activeTenancy.securityDeposit?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* ── PERSONAL INFO (inline editable) ── */}
          <div style={cardStyle}>
            <h4 style={sectionTitle}>
              👤 Personal Information
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "#9ca3af",
                  fontWeight: 400,
                  marginLeft: "8px",
                }}
              >
                click any field to edit
              </span>
            </h4>
            <div style={gridStyle}>
              <InlineField
                label="Full Name"
                value={tenant?.fullName}
                fieldName="fullName"
                tenantId={tenant?.id}
              />
              <InlineField
                label="Phone"
                value={tenant?.phone}
                fieldName="phone"
                tenantId={tenant?.id}
                type="tel"
              />
              <InlineField
                label="Email"
                value={tenant?.email}
                fieldName="email"
                tenantId={tenant?.id}
                type="email"
              />
              <InlineField
                label="Permanent Address"
                value={tenant?.address}
                fieldName="address"
                tenantId={tenant?.id}
              />
              <InlineField
                label="Date of Birth"
                value={tenant?.dateOfBirth}
                fieldName="dateOfBirth"
                tenantId={tenant?.id}
                type="date"
              />
              <InlineField
                label="Move-in Date"
                value={tenant?.moveInDate}
                fieldName="moveInDate"
                tenantId={tenant?.id}
                type="date"
              />
              <InlineField
                label="Occupation"
                value={tenant?.occupation}
                fieldName="occupation"
                tenantId={tenant?.id}
              />
              <InlineField
                label="Workplace"
                value={tenant?.workplace}
                fieldName="workplace"
                tenantId={tenant?.id}
              />
            </div>
          </div>

          {/* ── ID & VERIFICATION (inline editable) ── */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ ...cardStyle, flex: 1, minWidth: "260px" }}>
              <h4 style={sectionTitle}>🪪 ID Verification</h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <InlineField
                  label="ID Type"
                  value={tenant?.idType}
                  fieldName="idType"
                  tenantId={tenant?.id}
                  type="select"
                  options={[
                    { value: "Aadhaar", label: "Aadhaar" },
                    { value: "PAN", label: "PAN" },
                    { value: "Passport", label: "Passport" },
                    { value: "Driving License", label: "Driving License" },
                    { value: "Voter ID", label: "Voter ID" },
                  ]}
                />
                <InlineField
                  label="ID Number"
                  value={tenant?.idNumber}
                  fieldName="idNumber"
                  tenantId={tenant?.id}
                />
                <InlineField
                  label="Police Verification No."
                  value={tenant?.policeVerificationNumber}
                  fieldName="policeVerificationNumber"
                  tenantId={tenant?.id}
                />
                <InlineField
                  label="Police Verification Date"
                  value={tenant?.policeVerificationDate}
                  fieldName="policeVerificationDate"
                  tenantId={tenant?.id}
                  type="date"
                />
              </div>
            </div>

            <div style={{ ...cardStyle, flex: 1, minWidth: "260px" }}>
              <h4 style={sectionTitle}>🚨 Emergency Contact</h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <InlineField
                  label="Contact Name"
                  value={tenant?.emergencyContact}
                  fieldName="emergencyContact"
                  tenantId={tenant?.id}
                />
                <InlineField
                  label="Contact Phone"
                  value={tenant?.emergencyContactPhone}
                  fieldName="emergencyContactPhone"
                  tenantId={tenant?.id}
                  type="tel"
                />
              </div>
            </div>
          </div>

          {/* ── DOCUMENTS ── */}
          <TenantDocuments propertyId={propertyId} />
        </>
      ) : (
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "12px 24px",
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                alignSelf: "flex-start",
              }}
            >
              + Create New Tenancy
            </button>
          ) : (
            <CreateTenancyForm
              propertyId={propertyId}
              onCancel={() => setShowForm(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CREATE TENANCY FORM ───
// (only used when NO active tenancy exists)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CreateTenancyForm({
  propertyId,
  onCancel,
}: {
  propertyId: string;
  onCancel: () => void;
}) {
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 500,
    color: "#6b7280",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <form
      action={createTenancy}
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <input type="hidden" name="propertyId" value={propertyId} />

      <div style={cardStyle}>
        <h4 style={sectionTitle}>📋 New Tenancy</h4>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#9ca3af",
            margin: "0 0 12px 0",
          }}
        >
          Fill in basic details. You can add more info after creating.
        </p>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Tenant Name *</label>
            <input
              style={inputStyle}
              name="tenantName"
              required
              placeholder="Full Name"
            />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              style={inputStyle}
              name="tenantEmail"
              type="email"
              required
              placeholder="tenant@email.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              name="tenantPhone"
              type="tel"
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label style={labelStyle}>Permanent Address</label>
            <input
              style={inputStyle}
              name="address"
              placeholder="Permanent address"
            />
          </div>
          <div>
            <label style={labelStyle}>Monthly Rent (₹) *</label>
            <input
              style={inputStyle}
              name="monthlyRent"
              type="number"
              required
              min="0"
              placeholder="12000"
            />
          </div>
          <div>
            <label style={labelStyle}>Security Deposit (₹) *</label>
            <input
              style={inputStyle}
              name="securityDeposit"
              type="number"
              required
              min="0"
              placeholder="24000"
            />
          </div>
          <div>
            <label style={labelStyle}>Lease Start *</label>
            <input style={inputStyle} name="leaseStart" type="date" required />
          </div>
          <div>
            <label style={labelStyle}>Lease End (optional)</label>
            <input style={inputStyle} name="leaseEnd" type="date" />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="submit"
          style={{
            padding: "10px 24px",
            border: "none",
            borderRadius: "8px",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Create Tenancy
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "10px 24px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            background: "#fff",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── TENANT DOCUMENTS ───
// Rent Agreement + Police Verification
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TenantDocuments({ propertyId }: { propertyId: string }) {
  const [uploading, setUploading] = useState<string | null>(null);

  async function handleFileSelect(
    category: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(category);
    try {
      // Step 1: Get presigned URL
      const sanitizedFilename = file.name
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .substring(0, 200);

      const presignedResponse = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: sanitizedFilename,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!presignedResponse.ok) {
        toast.error("Failed to get upload URL");
        return;
      }

      const { presignedUrl, key } = await presignedResponse.json();

      // Step 2: Upload to S3
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        toast.error("Upload to storage failed");
        return;
      }

      // Step 3: Save record via server action
      const formData = new FormData();
      formData.append("propertyId", propertyId);
      formData.append("documentName", `${category} - ${file.name}`);
      formData.append("category", category);
      formData.append("fileUrl", key);
      formData.append("fileSize", file.size.toString());
      formData.append("mimeType", file.type);

      const result = await uploadDocument(formData);
      if (result.success) {
        toast.success(`${category} uploaded`);
      } else {
        toast.error(result.error || "Save failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }

  const slotStyle: React.CSSProperties = {
    flex: 1,
    minWidth: "240px",
    border: "2px dashed #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  };

  return (
    <div style={cardStyle}>
      <h4 style={sectionTitle}>📎 Tenant Documents</h4>
      <p
        style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 16px 0" }}
      >
        Upload Rent Agreement and Police Verification. They also appear in the
        Documents tab.
      </p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={slotStyle}>
          <span style={{ fontSize: "2rem" }}>📄</span>
          <p style={{ fontWeight: 600, margin: 0 }}>Rent Agreement</p>
          <label
            style={{
              padding: "8px 20px",
              background:
                uploading === "Rent Agreement" ? "#9ca3af" : "#2563eb",
              color: "#fff",
              borderRadius: "8px",
              cursor: uploading === "Rent Agreement" ? "wait" : "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            {uploading === "Rent Agreement" ? "Uploading..." : "Choose File"}
            <input
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => handleFileSelect("Rent Agreement", e)}
              disabled={uploading === "Rent Agreement"}
            />
          </label>
          <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
            PDF or Image, max 10MB
          </span>
        </div>

        <div style={slotStyle}>
          <span style={{ fontSize: "2rem" }}>🔍</span>
          <p style={{ fontWeight: 600, margin: 0 }}>Police Verification</p>
          <label
            style={{
              padding: "8px 20px",
              background:
                uploading === "Police Verification" ? "#9ca3af" : "#2563eb",
              color: "#fff",
              borderRadius: "8px",
              cursor: uploading === "Police Verification" ? "wait" : "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            {uploading === "Police Verification"
              ? "Uploading..."
              : "Choose File"}
            <input
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => handleFileSelect("Police Verification", e)}
              disabled={uploading === "Police Verification"}
            />
          </label>
          <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
            PDF or Image, max 10MB
          </span>
        </div>
      </div>
    </div>
  );
}
