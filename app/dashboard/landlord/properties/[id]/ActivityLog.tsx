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

// ─── Dark-theme icon + bg per event type ───
const TYPE_CONFIG: Record<string, { icon: string; bg: string }> = {
  MAINTENANCE_RAISED: { icon: "🔧", bg: "#2a1515" },
  MAINTENANCE_UPDATED: { icon: "🔄", bg: "#2a2010" },
  MAINTENANCE_COMPLETED: { icon: "✅", bg: "#0d2018" },
  MAINTENANCE_DELETED: { icon: "🗑️", bg: "#1a1a1a" },
  DOCUMENT_UPLOADED: { icon: "📄", bg: "#0f1b2d" },
  DOCUMENT_DELETED: { icon: "📄", bg: "#1a1a1a" },
  BILL_CREATED: { icon: "💰", bg: "#1e1030" },
  PAYMENT_ADDED: { icon: "💳", bg: "#0d2018" },
  TENANT_ADDED: { icon: "👤", bg: "#0d1f24" },
  TENANCY_CREATED: { icon: "🏠", bg: "#0d1f24" },
  PROPERTY_UPDATED: { icon: "🏠", bg: "#161830" },
};

const DEFAULT_CONFIG = { icon: "📌", bg: "#1a1a1a" };

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
    <div className="alog-wrap">
      <h2 className="alog-heading">Activity Log</h2>

      {dateKeys.length === 0 ? (
        <p className="alog-empty">No activity recorded yet</p>
      ) : (
        <div className="alog-groups">
          {dateKeys.map((dateKey) => (
            <div key={dateKey} className="alog-group">
              {/* Date header */}
              <div className="alog-date">{dateKey}</div>

              {/* Timeline rows */}
              <div className="alog-timeline">
                {grouped[dateKey].map((log, index) => {
                  const config = TYPE_CONFIG[log.type] || DEFAULT_CONFIG;
                  const isLast = index === grouped[dateKey].length - 1;

                  return (
                    <div key={log.id} className="alog-row">
                      {/* Dot + connector line */}
                      <div className="alog-dot-col">
                        <div
                          className="alog-dot"
                          style={{ background: config.bg }}
                        >
                          {config.icon}
                        </div>
                        {!isLast && <div className="alog-line" />}
                      </div>

                      {/* Text content */}
                      <div
                        className={`alog-content${isLast ? " alog-content--last" : ""}`}
                      >
                        <p className="alog-desc">{log.description}</p>
                        <span className="alog-time">
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
