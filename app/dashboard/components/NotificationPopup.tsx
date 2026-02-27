"use client";
import { useState } from "react";
import { sendSelectedNotifications } from "../notifications/actions";

interface Tenant {
  id: string;
  fullName: string;
}

interface Props {
  tenants: Tenant[];
  onClose: () => void;
}

// ── 3 pre-built templates ────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "reminder",
    label: "Rent Reminder",
    title: "Rent Reminder",
    message:
      "This is a reminder that your rent payment is due soon. Please arrange payment at your earliest convenience.",
  },
  {
    id: "overdue",
    label: "⚠️ Overdue Notice",
    title: "Overdue Payment Notice",
    message:
      "Your rent payment is now overdue. Please make the payment immediately to avoid any issues.",
  },
  {
    id: "invoice",
    label: "📄 Send Invoice",
    title: "Your Invoice is Ready",
    message:
      "Your monthly bill has been generated. Please log in to RentLedger to view and pay your invoice.",
  },
] as const;

type TemplateId = (typeof TEMPLATES)[number]["id"];

export function NotificationPopup({ tenants, onClose }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>("reminder");
  const [customMessage, setCustomMessage] = useState<string>(
    TEMPLATES[0].message,
  );
  const [sendEmail, setSendEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const activeTemplate = TEMPLATES.find((t) => t.id === templateId)!;

  // When template changes, pre-fill textarea with that template's message
  function handleTemplateChange(id: TemplateId) {
    setTemplateId(id);
    setCustomMessage(TEMPLATES.find((t) => t.id === id)!.message);
  }

  function toggleTenant(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.length === tenants.length ? [] : tenants.map((t) => t.id),
    );
  }

  async function handleSend() {
    if (selected.length === 0) {
      setResult("Select at least one tenant.");
      return;
    }
    setSending(true);
    setResult(null);

    const fd = new FormData();
    fd.set("selectedIds", JSON.stringify(selected));
    fd.set("title", activeTemplate.title);
    fd.set("message", customMessage);
    fd.set("type", templateId === "overdue" ? "warning" : "info");
    fd.set("sendEmail", String(sendEmail));
    fd.set("includeInvoice", String(templateId === "invoice"));

    const res = await sendSelectedNotifications(fd);
    setSending(false);

    if ("error" in res) {
      setResult(`❌ ${res.error}`);
    } else {
      setResult(
        `✅ Sent to ${res.sent} tenant${res.sent !== 1 ? "s" : ""}${sendEmail ? " (+ email)" : ""}`,
      );
      setSelected([]);
    }
  }

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div className="notif-popup" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="notif-header">
          <span className="notif-title">
            <i
              className="fi fi-br-bell"
              style={{
                fontSize: "16px",
                marginRight: "6px",
                verticalAlign: "middle",
              }}
            ></i>
            Notifications
          </span>
          <button className="notif-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Enable toggle */}
        <div className="notif-section">
          <div className="notif-toggle-row">
            <span className="notif-label" style={{ marginBottom: 0 }}>
              Bulk Notifications
            </span>
            <button
              className={`notif-toggle ${enabled ? "notif-toggle--on" : ""}`}
              onClick={() => setEnabled(!enabled)}
              aria-pressed={enabled}
            >
              <span className="notif-toggle-thumb" />
              <span className="notif-toggle-text">
                {enabled ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </div>

        {/* Locked */}
        {!enabled && (
          <div className="notif-locked">
            <p>🔒 Bulk notifications are a Pro feature.</p>
            <p className="notif-locked-sub">
              Enable the toggle to send notifications.
            </p>
          </div>
        )}

        {enabled && (
          <>
            {/* Template picker */}
            <div className="notif-section">
              <span className="notif-label">Choose Template</span>
              <div className="notif-template-list">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    className={`notif-template-btn ${templateId === t.id ? "notif-template-btn--active" : ""}`}
                    onClick={() => handleTemplateChange(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {/* Editable message — pre-filled from template, landlord can customise */}
              <textarea
                className="notif-textarea"
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
            </div>

            {/* Tenant list */}
            <div className="notif-section">
              <div className="notif-row-space">
                <span className="notif-label" style={{ marginBottom: 0 }}>
                  Select Tenants
                </span>
                <button className="notif-link-btn" onClick={toggleAll}>
                  {selected.length === tenants.length ? "None" : "All"}
                </button>
              </div>
              {tenants.length === 0 ? (
                <p className="notif-empty">No tenants yet.</p>
              ) : (
                <ul className="notif-tenant-list">
                  {tenants.map((t) => (
                    <li key={t.id} className="notif-tenant-item">
                      <label className="material-checkbox notif-tenant-label">
                        <input
                          type="checkbox"
                          checked={selected.includes(t.id)}
                          onChange={() => toggleTenant(t.id)}
                        />
                        <span className="checkmark"></span>
                        {t.fullName}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Email option */}
            <div className="notif-section">
              <label
                className="material-checkbox notif-tenant-label"
                style={{ padding: 0 }}
              >
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <span className="checkmark"></span>
                Also send via email
                {templateId === "invoice" && " (includes bill summary)"}
              </label>
            </div>

            {/* Footer */}
            <div className="notif-footer">
              {result && <p className="notif-result">{result}</p>}
              <button
                className="notif-send-btn"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? "Sending…" : `Send to Selected (${selected.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
