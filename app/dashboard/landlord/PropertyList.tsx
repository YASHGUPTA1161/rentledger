"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { updateProperty, deleteProperty } from "./actions";
import "./PropertyList.css";

interface Property {
  id: string;
  address: string;
  description: string | null;
  createdAt: Date;
}

export function PropertyList({ properties }: { properties: Property[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    // Collapsing resets edit mode too
    setExpandedId((prev) => (prev === id ? null : id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <ul className="plist">
      {properties.map((property) => {
        const isExpanded = expandedId === property.id;
        const isEditing = editingId === property.id;

        return (
          <li
            key={property.id}
            className={`plist-card${isExpanded ? " plist-card--open" : ""}`}
          >
            {/* ── Collapsed header — always visible ─────────────────────── */}
            <button
              className="plist-header"
              onClick={() => toggleExpand(property.id)}
              aria-expanded={isExpanded}
            >
              <span className="plist-pin">
                <i className="fi fi-sr-marker"></i>
              </span>
              <span className="plist-address">{property.address}</span>
              <span
                className={`plist-chevron${isExpanded ? " plist-chevron--up" : ""}`}
              >
                ‹
              </span>
            </button>

            {/* ── Expanded body ──────────────────────────────────────────── */}
            {isExpanded && (
              <div className="plist-body">
                {isEditing ? (
                  /* ── EDIT FORM ───────────────────────────────────────── */
                  <form action={updateProperty} className="plist-edit-form">
                    <input
                      type="hidden"
                      name="propertyId"
                      value={property.id}
                    />

                    <div className="plist-field">
                      <label
                        htmlFor={`addr-${property.id}`}
                        className="plist-label"
                      >
                        Address
                      </label>
                      <input
                        id={`addr-${property.id}`}
                        type="text"
                        name="address"
                        defaultValue={property.address}
                        className="plist-input"
                        required
                      />
                    </div>

                    <div className="plist-field">
                      <label
                        htmlFor={`desc-${property.id}`}
                        className="plist-label"
                      >
                        Notes
                      </label>
                      <textarea
                        id={`desc-${property.id}`}
                        name="description"
                        defaultValue={property.description ?? ""}
                        className="plist-textarea"
                      />
                    </div>

                    <div className="plist-actions">
                      <button
                        type="submit"
                        className="plist-btn plist-btn--save"
                      >
                        ✅ Save
                      </button>
                      <button
                        type="button"
                        className="plist-btn plist-btn--cancel"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ── VIEW MODE ───────────────────────────────────────── */
                  <>
                    {property.description && (
                      <p className="plist-desc">{property.description}</p>
                    )}

                    <p className="plist-date">
                      Added{" "}
                      {new Date(property.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>

                    <div className="plist-actions">
                      {/* View property page */}
                      <Link
                        href={`/dashboard/landlord/properties/${property.id}`}
                        className="plist-btn plist-btn--view"
                      >
                        Open →
                      </Link>

                      {/* Edit */}
                      <button
                        className="plist-btn plist-btn--edit"
                        onClick={() => setEditingId(property.id)}
                      >
                        ✏️ Edit
                      </button>

                      {/* Delete with toast confirm */}
                      <form
                        action={deleteProperty}
                        style={{ display: "inline" }}
                      >
                        <input
                          type="hidden"
                          name="propertyId"
                          value={property.id}
                        />
                        <button
                          type="submit"
                          className="plist-btn plist-btn--delete"
                          onClick={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget.closest("form");
                            if (!form) return;
                            toast(
                              (t) => (
                                <div>
                                  <p
                                    style={{
                                      marginBottom: "8px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Delete this property?
                                  </p>
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                      onClick={() => {
                                        toast.dismiss(t.id);
                                        form.requestSubmit();
                                      }}
                                      style={{
                                        padding: "6px 12px",
                                        background: "#ef4444",
                                        color: "#fff",
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
                                        background: "#6b7280",
                                        color: "#fff",
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
                              { duration: 5000, position: "bottom-right" },
                            );
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
