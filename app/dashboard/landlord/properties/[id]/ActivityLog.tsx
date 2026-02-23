"use client";

interface ActivityLogEntry {
  id: string;
  type: string;
  description: string;
  date: string;
  relatedId: string | null;
}

interface ActivityLogProps {
  propertyId: string;
  activityLogs: ActivityLogEntry[];
}

// ─── Icon + color per type ───

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> =
  {
    MAINTENANCE_RAISED: { icon: "🔧", color: "#dc2626", bg: "#fef2f2" },
    MAINTENANCE_UPDATED: { icon: "🔄", color: "#d97706", bg: "#fffbeb" },
    MAINTENANCE_COMPLETED: { icon: "✅", color: "#059669", bg: "#ecfdf5" },
    MAINTENANCE_DELETED: { icon: "🗑️", color: "#6b7280", bg: "#f9fafb" },
    DOCUMENT_UPLOADED: { icon: "📄", color: "#2563eb", bg: "#eff6ff" },
    DOCUMENT_DELETED: { icon: "📄", color: "#6b7280", bg: "#f9fafb" },
    BILL_CREATED: { icon: "💰", color: "#7c3aed", bg: "#f5f3ff" },
    PAYMENT_ADDED: { icon: "💳", color: "#059669", bg: "#ecfdf5" },
    TENANT_ADDED: { icon: "👤", color: "#0891b2", bg: "#ecfeff" },
    TENANCY_CREATED: { icon: "🏠", color: "#0891b2", bg: "#ecfeff" },
    PROPERTY_UPDATED: { icon: "🏠", color: "#6366f1", bg: "#eef2ff" },
  };

const DEFAULT_CONFIG = { icon: "📌", color: "#6b7280", bg: "#f9fafb" };

// ─── Group logs by date ───

function groupByDate(logs: ActivityLogEntry[]) {
  const groups: Record<string, ActivityLogEntry[]> = {};

  for (const log of logs) {
    const dateKey = new Date(log.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(log);
  }

  return groups;
}

// ─── Component ───

export function ActivityLog({ activityLogs }: ActivityLogProps) {
  const grouped = groupByDate(activityLogs);
  const dateKeys = Object.keys(grouped);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
        Activity Log
      </h2>

      {dateKeys.length === 0 ? (
        <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>
          No activity recorded yet
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              {/* Date header */}
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "12px",
                  paddingBottom: "4px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {dateKey}
              </div>

              {/* Timeline items */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "0" }}
              >
                {grouped[dateKey].map((log, index) => {
                  const config = TYPE_CONFIG[log.type] || DEFAULT_CONFIG;
                  const isLast = index === grouped[dateKey].length - 1;

                  return (
                    <div
                      key={log.id}
                      style={{
                        display: "flex",
                        gap: "12px",
                        position: "relative",
                      }}
                    >
                      {/* Timeline line + dot */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          width: "32px",
                          flexShrink: 0,
                        }}
                      >
                        {/* Dot */}
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: config.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.875rem",
                            flexShrink: 0,
                          }}
                        >
                          {config.icon}
                        </div>
                        {/* Line */}
                        {!isLast && (
                          <div
                            style={{
                              width: "2px",
                              flex: 1,
                              backgroundColor: "#e5e7eb",
                              minHeight: "16px",
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div
                        style={{
                          paddingBottom: isLast ? "0" : "16px",
                          flex: 1,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.875rem",
                            color: "#111827",
                            lineHeight: "32px",
                          }}
                        >
                          {log.description}
                        </p>
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          {new Date(log.date).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
