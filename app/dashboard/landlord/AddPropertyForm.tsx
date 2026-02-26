"use client";

import { useState } from "react";
import { createProperty } from "./actions";
import "./PropertyList.css"; /* reuse same plist-* classes */

export function AddPropertyForm() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`plist-card${isOpen ? " plist-card--open" : ""}`}
      style={{ marginBottom: "2rem" }}
    >
      {/* ── Collapsed trigger ─────────────────────────────────────── */}
      <button
        className="plist-header"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
      >
        <span style={{ fontSize: "1rem" }}>＋</span>
        <span className="plist-address" style={{ fontWeight: 600 }}>
          Add New Property
        </span>
        <span className={`plist-chevron${isOpen ? " plist-chevron--up" : ""}`}>
          ‹
        </span>
      </button>

      {/* ── Expanded form ─────────────────────────────────────────── */}
      {isOpen && (
        <div className="plist-body">
          <form
            action={async (fd) => {
              await createProperty(fd);
              setIsOpen(false); // collapse after submit
            }}
            className="plist-edit-form"
          >
            <div className="plist-field">
              <label htmlFor="add-address" className="plist-label">
                Property Address (include city, state)
              </label>
              <input
                id="add-address"
                type="text"
                name="address"
                placeholder="123 Main St, Apt 2B, New York, NY 10001"
                className="plist-input"
                required
              />
            </div>

            <div className="plist-field">
              <label htmlFor="add-description" className="plist-label">
                Notes (optional)
              </label>
              <textarea
                id="add-description"
                name="description"
                placeholder="2nd floor corner unit, near subway"
                className="plist-textarea"
              />
            </div>

            <div className="plist-actions">
              <button type="submit" className="plist-btn plist-btn--save">
                ✅ Add Property
              </button>
              <button
                type="button"
                className="plist-btn plist-btn--cancel"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
