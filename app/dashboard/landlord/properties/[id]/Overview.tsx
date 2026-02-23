"use client";

interface OverviewProps {
  propertyId: string;
  activeTenancy: Record<string, unknown> | null;
  bills: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  maintenanceRequests: Record<string, unknown>[];
  activityLogs: Record<string, unknown>[];
}

// ─── Helpers ───

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

const TYPE_ICONS: Record<string, string> = {
  MAINTENANCE_RAISED: "🔧",
  MAINTENANCE_UPDATED: "🔄",
  MAINTENANCE_COMPLETED: "✅",
  MAINTENANCE_DELETED: "🗑️",
  DOCUMENT_UPLOADED: "📄",
  DOCUMENT_DELETED: "📄",
  BILL_CREATED: "💰",
  PAYMENT_ADDED: "💳",
  TENANT_ADDED: "👤",
  TENANCY_CREATED: "🏠",
  PROPERTY_UPDATED: "🏠",
};

const STATUS_BADGE: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  paid: { label: "✅ Paid", color: "#059669", bg: "#ecfdf5" },
  partial: { label: "🟡 Partial", color: "#d97706", bg: "#fffbeb" },
  unpaid: { label: "🔴 Unpaid", color: "#dc2626", bg: "#fef2f2" },
  overdue: { label: "🔴 Overdue", color: "#dc2626", bg: "#fef2f2" },
};

// ─── Styles ───

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  padding: "20px",
};

const statCardStyle: React.CSSProperties = {
  ...cardStyle,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  flex: 1,
  minWidth: "140px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#6b7280",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const valueStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "#111827",
};

// ─── Component ───

export function Overview({
  activeTenancy,
  bills,
  documents,
  maintenanceRequests,
  activityLogs,
}: OverviewProps) {
  // ── Derived data ──
  const monthlyRent = (activeTenancy?.monthlyRent as number) || 0;
  const openIssues = maintenanceRequests.filter(
    (r) => r.status !== "completed" && r.status !== "cancelled",
  ).length;
  const urgentIssues = maintenanceRequests.filter(
    (r) =>
      r.priority === "HIGH" &&
      r.status !== "completed" &&
      r.status !== "cancelled",
  ).length;
  const isOccupied = !!activeTenancy;

  // Last 3 months rent bills (sorted by month desc)
  const rentBills = [...bills]
    .sort(
      (a, b) =>
        new Date(b.month as string).getTime() -
        new Date(a.month as string).getTime(),
    )
    .slice(0, 3);

  // Tenant info
  const tenant = activeTenancy?.tenant as Record<string, unknown> | undefined;
  const tenantName = (tenant?.fullName as string) || "—";
  const tenancyStart = activeTenancy?.startDate
    ? new Date(activeTenancy.startDate as string).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
  const securityDeposit = (activeTenancy?.securityDeposit as number) || 0;

  // Recent activity (last 5)
  const recentActivity = activityLogs.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
        Overview
      </h2>

      {/* ── Summary Cards ── */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={statCardStyle}>
          <span style={labelStyle}>Monthly Rent</span>
          <span style={valueStyle}>{formatCurrency(monthlyRent)}</span>
        </div>

        <div style={statCardStyle}>
          <span style={labelStyle}>Open Issues</span>
          <span
            style={{
              ...valueStyle,
              color: openIssues > 0 ? "#dc2626" : "#059669",
            }}
          >
            {openIssues}
          </span>
          {urgentIssues > 0 && (
            <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>
              {urgentIssues} urgent
            </span>
          )}
        </div>

        <div style={statCardStyle}>
          <span style={labelStyle}>Documents</span>
          <span style={valueStyle}>{documents.length}</span>
        </div>

        <div style={statCardStyle}>
          <span style={labelStyle}>Status</span>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: isOccupied ? "#059669" : "#d97706",
              backgroundColor: isOccupied ? "#ecfdf5" : "#fffbeb",
              padding: "4px 12px",
              borderRadius: "999px",
              display: "inline-block",
              marginTop: "4px",
            }}
          >
            {isOccupied ? "OCCUPIED" : "VACANT"}
          </span>
        </div>
      </div>

      {/* ── Tenant + Rent History Row ── */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {/* Current Tenant */}
        <div style={{ ...cardStyle, flex: 1, minWidth: "260px" }}>
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#374151",
              margin: "0 0 16px 0",
            }}
          >
            🏠 Current Tenant
          </h3>
          {isOccupied ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <span style={labelStyle}>Name</span>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {tenantName}
                </p>
              </div>
              <div>
                <span style={labelStyle}>Since</span>
                <p style={{ margin: "2px 0 0", color: "#111827" }}>
                  {tenancyStart}
                </p>
              </div>
              <div>
                <span style={labelStyle}>Security Deposit</span>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {formatCurrency(securityDeposit)}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: "#9ca3af", margin: 0 }}>No active tenancy</p>
          )}
        </div>

        {/* Rent History */}
        <div style={{ ...cardStyle, flex: 1.5, minWidth: "320px" }}>
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#374151",
              margin: "0 0 16px 0",
            }}
          >
            📊 Rent History (Last 3 Months)
          </h3>
          {rentBills.length === 0 ? (
            <p style={{ color: "#9ca3af", margin: 0 }}>No bills yet</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 0",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    Month
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 0",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    Total
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 0",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    Paid
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "8px 0",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rentBills.map((bill) => {
                  const status = bill.status as string;
                  const badge = STATUS_BADGE[status] || STATUS_BADGE.unpaid;

                  return (
                    <tr
                      key={bill.id as string}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={{ padding: "10px 0", color: "#111827" }}>
                        {new Date(bill.month as string).toLocaleDateString(
                          "en-IN",
                          { month: "short", year: "numeric" },
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "10px 0",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(bill.totalBill as number)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "10px 0",
                          color: "#059669",
                        }}
                      >
                        {formatCurrency(bill.paidAmount as number)}
                      </td>
                      <td style={{ textAlign: "center", padding: "10px 0" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: badge.color,
                            backgroundColor: badge.bg,
                            padding: "2px 8px",
                            borderRadius: "999px",
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div style={cardStyle}>
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#374151",
            margin: "0 0 16px 0",
          }}
        >
          📌 Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p style={{ color: "#9ca3af", margin: 0 }}>No activity yet</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {recentActivity.map((log) => (
              <div
                key={log.id as string}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "#111827" }}>
                  {TYPE_ICONS[log.type as string] || "📌"}{" "}
                  {log.description as string}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                    flexShrink: 0,
                    marginLeft: "12px",
                  }}
                >
                  {timeAgo(log.date as string)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
