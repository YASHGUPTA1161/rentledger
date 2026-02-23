"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { raiseMaintenanceRequest } from "./tenant-actions";

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
}

interface TenantMaintenanceProps {
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  requested: { bg: "#dbeafe", text: "#1e40af" },
  in_progress: { bg: "#fef3c7", text: "#92400e" },
  completed: { bg: "#d1fae5", text: "#065f46" },
  cancelled: { bg: "#f3f4f6", text: "#6b7280" },
};

// ─── Component ───

export function TenantMaintenance({
  propertyId,
  maintenanceRequests,
}: TenantMaintenanceProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("propertyId", propertyId);

    const result = await raiseMaintenanceRequest(formData);

    if (result.success) {
      toast.success("Issue raised successfully!", { position: "bottom-right" });
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    } else {
      toast.error(result.error || "Failed to raise issue", {
        position: "bottom-right",
      });
    }

    setIsSubmitting(false);
  };

  const filteredRequests =
    statusFilter === "all"
      ? maintenanceRequests
      : maintenanceRequests.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Maintenance Issues</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "8px 16px",
            background: showForm ? "#f3f4f6" : "#dc2626",
            color: showForm ? "#374151" : "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          {showForm ? "Cancel" : "🔧 Raise Issue"}
        </button>
      </div>

      {/* Raise Issue Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
          }}
          className="space-y-4"
        >
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "#374151" }}
            >
              Issue Title *
            </label>
            <input
              name="title"
              required
              placeholder="e.g. Leaking tap in kitchen"
              className="w-full border rounded-lg px-3 py-2"
              style={{ borderColor: "#d1d5db" }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "#374151" }}
            >
              Description *
            </label>
            <textarea
              name="description"
              required
              rows={3}
              placeholder="Describe the issue in detail..."
              className="w-full border rounded-lg px-3 py-2"
              style={{ borderColor: "#d1d5db" }}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "#374151" }}
              >
                Category
              </label>
              <select
                name="category"
                className="w-full border rounded-lg px-3 py-2"
                style={{ borderColor: "#d1d5db" }}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "#374151" }}
              >
                Priority
              </label>
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="w-full border rounded-lg px-3 py-2"
                style={{ borderColor: "#d1d5db" }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "10px 20px",
              background: isSubmitting ? "#9ca3af" : "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Issue"}
          </button>
        </form>
      )}

      {/* Status Filter */}
      <div className="flex gap-2">
        {["all", "requested", "in_progress", "completed", "cancelled"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "1px solid",
                borderColor: statusFilter === status ? "#2563eb" : "#d1d5db",
                background: statusFilter === status ? "#eff6ff" : "#fff",
                color: statusFilter === status ? "#2563eb" : "#6b7280",
                cursor: "pointer",
              }}
            >
              {status === "all"
                ? `All (${maintenanceRequests.length})`
                : status
                    .replace("_", " ")
                    .replace(/^\w/, (c) => c.toUpperCase())}
            </button>
          ),
        )}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div
          className="border rounded-lg p-8 bg-white shadow-sm text-center"
          style={{ color: "#6b7280" }}
        >
          <p className="text-lg mb-2">
            {statusFilter === "all"
              ? "No issues raised yet"
              : `No ${statusFilter.replace("_", " ")} issues`}
          </p>
          <p className="text-sm">
            Raise an issue if something needs fixing in your property.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const statusStyle =
              STATUS_COLORS[req.status] || STATUS_COLORS.requested;

            return (
              <div
                key={req.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4
                        style={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          margin: 0,
                        }}
                      >
                        {req.title}
                      </h4>
                      <span
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {req.status.replace("_", " ")}
                      </span>
                    </div>
                    <p
                      style={{
                        color: "#4b5563",
                        fontSize: "0.875rem",
                        margin: "4px 0",
                      }}
                    >
                      {req.description}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        fontSize: "0.75rem",
                        color: "#9ca3af",
                        marginTop: "8px",
                      }}
                    >
                      {req.category && <span>📁 {req.category}</span>}
                      <span>⚡ {req.priority}</span>
                      <span>
                        📅{" "}
                        {new Date(req.requestedAt).toLocaleDateString("en-IN")}
                      </span>
                      {req.completedAt && (
                        <span>
                          ✅{" "}
                          {new Date(req.completedAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resolution Notes */}
                {req.resolutionNotes && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px",
                      background: "#f0fdf4",
                      borderRadius: "6px",
                      border: "1px solid #bbf7d0",
                      fontSize: "0.85rem",
                      color: "#166534",
                    }}
                  >
                    <strong>Resolution:</strong> {req.resolutionNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
