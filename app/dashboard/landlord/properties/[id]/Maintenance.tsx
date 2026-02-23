"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  createMaintenanceRequest,
  updateMaintenanceStatus,
  deleteMaintenanceRequest,
} from "./maintenance-actions";

// ─── Types ───

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: string;
  status: string;
  resolutionNotes: string | null;
  requestedAt: string;
  completedAt: string | null;
  tenant?: { fullName: string } | null;
}

interface MaintenanceProps {
  propertyId: string;
  maintenanceRequests: MaintenanceRequest[];
}

// ─── Constants ───

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Appliance",
  "Structural",
  "Pest Control",
  "Painting",
  "Other",
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  LOW: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  MEDIUM: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  HIGH: { bg: "#fed7aa", text: "#9a3412", border: "#fb923c" },
  URGENT: { bg: "#fecaca", text: "#991b1b", border: "#f87171" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  requested: { bg: "#dbeafe", text: "#1e40af" },
  in_progress: { bg: "#fef3c7", text: "#92400e" },
  completed: { bg: "#d1fae5", text: "#065f46" },
  cancelled: { bg: "#f3f4f6", text: "#6b7280" },
};

// ─── Component ───

export function Maintenance({
  propertyId,
  maintenanceRequests,
}: MaintenanceProps) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter requests
  const filteredRequests =
    filter === "all"
      ? maintenanceRequests
      : maintenanceRequests.filter((r) => r.status === filter);

  // ─── Raise Issue ───
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("propertyId", propertyId);

      const result = await createMaintenanceRequest(formData);

      if (result.success) {
        toast.success("Issue raised");
        setShowForm(false);
        window.location.reload();
      } else {
        toast.error(result.error || "Failed");
      }
    } catch {
      toast.error("Failed to raise issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Status Update ───
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    let notes: string | undefined;

    // Ask for resolution notes when completing
    if (newStatus === "completed") {
      notes = prompt("Resolution notes (optional):") || undefined;
    }

    const result = await updateMaintenanceStatus(id, newStatus, notes);

    if (result.success) {
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      window.location.reload();
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  // ─── Delete ───
  const handleDelete = async (id: string, title: string) => {
    toast(
      (t) => (
        <div>
          <p style={{ marginBottom: "8px" }}>
            Delete <strong>{title}</strong>?
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const result = await deleteMaintenanceRequest(id);
                if (result.success) {
                  toast.success("Deleted");
                  window.location.reload();
                } else {
                  toast.error(result.error || "Failed");
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
      { duration: 5000 },
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ─── Header ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
          Maintenance Requests
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "8px 16px",
            backgroundColor: showForm ? "#6b7280" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {showForm ? "Cancel" : "+ Raise Issue"}
        </button>
      </div>

      {/* ─── Raise Issue Form ─── */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
            backgroundColor: "white",
          }}
        >
          {/* Row 1: Title + Category + Priority */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <div style={{ flex: 2 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Title *
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Leaking Tap in Bathroom"
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Category
              </label>
              <select
                name="category"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Priority
              </label>
              <select
                name="priority"
                defaultValue="MEDIUM"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Description + Submit */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Description
              </label>
              <input
                type="text"
                name="description"
                placeholder="Details about the issue..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "8px 24px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.5 : 1,
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      )}

      {/* ─── Filter Bar ─── */}
      <div style={{ display: "flex", gap: "8px" }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border:
                filter === s.value ? "2px solid #2563eb" : "1px solid #d1d5db",
              backgroundColor: filter === s.value ? "#dbeafe" : "white",
              color: filter === s.value ? "#1e40af" : "#374151",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: filter === s.value ? 600 : 400,
            }}
          >
            {s.label}
            {s.value !== "all" && (
              <span style={{ marginLeft: "6px", opacity: 0.6 }}>
                {
                  maintenanceRequests.filter((r) =>
                    s.value === "all" ? true : r.status === s.value,
                  ).length
                }
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Request Cards ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredRequests.length === 0 ? (
          <p
            style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}
          >
            No maintenance requests{" "}
            {filter !== "all"
              ? `with status "${filter.replace("_", " ")}"`
              : "yet"}
          </p>
        ) : (
          filteredRequests.map((req) => {
            const priorityColor =
              PRIORITY_COLORS[req.priority] || PRIORITY_COLORS.MEDIUM;
            const statusStyle =
              STATUS_STYLES[req.status] || STATUS_STYLES.requested;

            return (
              <div
                key={req.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderLeft: `4px solid ${priorityColor.border}`,
                }}
              >
                {/* Left: Info */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    {/* Priority badge */}
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: priorityColor.bg,
                        color: priorityColor.text,
                      }}
                    >
                      {req.priority}
                    </span>

                    {/* Category */}
                    {req.category && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          backgroundColor: "#f3f4f6",
                          color: "#4b5563",
                        }}
                      >
                        {req.category}
                      </span>
                    )}

                    {/* Status badge */}
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {req.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      margin: "4px 0",
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {req.title}
                  </h3>

                  {/* Description */}
                  {req.description && (
                    <p
                      style={{
                        margin: "4px 0",
                        fontSize: "0.875rem",
                        color: "#6b7280",
                      }}
                    >
                      {req.description}
                    </p>
                  )}

                  {/* Resolution notes */}
                  {req.resolutionNotes && (
                    <p
                      style={{
                        margin: "4px 0",
                        fontSize: "0.875rem",
                        color: "#059669",
                        fontStyle: "italic",
                      }}
                    >
                      Resolution: {req.resolutionNotes}
                    </p>
                  )}

                  {/* Meta info */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginTop: "8px",
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                    }}
                  >
                    <span>
                      Raised: {new Date(req.requestedAt).toLocaleDateString()}
                    </span>
                    {req.completedAt && (
                      <span>
                        Completed:{" "}
                        {new Date(req.completedAt).toLocaleDateString()}
                      </span>
                    )}
                    {req.tenant && <span>Tenant: {req.tenant.fullName}</span>}
                  </div>
                </div>

                {/* Right: Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginLeft: "16px",
                    flexShrink: 0,
                  }}
                >
                  {req.status === "requested" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusUpdate(req.id, "in_progress")
                        }
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                        }}
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(req.id, "cancelled")}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {req.status === "in_progress" && (
                    <button
                      onClick={() => handleStatusUpdate(req.id, "completed")}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(req.id, req.title)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
