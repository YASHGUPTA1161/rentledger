"use client";

import { useState } from "react";
import Link from "next/link";
import { updateProperty, deleteProperty } from "./actions";

interface Property {
  id: string;
  address: string;
  description: string | null;
  createdAt: Date;
}

export function PropertyList({ properties }: { properties: Property[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {properties.map((property) => (
        <li
          key={property.id}
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          {editingId === property.id ? (
            // EDIT MODE: Show inline edit form
            <form
              action={updateProperty}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <input type="hidden" name="propertyId" value={property.id} />

              <div>
                <label htmlFor={`address-${property.id}`}>Address:</label>
                <input
                  type="text"
                  id={`address-${property.id}`}
                  name="address"
                  defaultValue={property.address}
                  style={{ width: "100%", padding: "8px" }}
                  required
                />
              </div>

              <div>
                <label htmlFor={`description-${property.id}`}>
                  Description:
                </label>
                <textarea
                  id={`description-${property.id}`}
                  name="description"
                  defaultValue={property.description || ""}
                  style={{ width: "100%", padding: "8px", minHeight: "60px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ✅ Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  style={{
                    padding: "8px 16px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          ) : (
            // VIEW MODE: Show property details + Edit/Delete buttons
            <>
              <Link
                href={`/dashboard/landlord/properties/${property.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: "bold",
                }}
              >
                📍 {property.address}
              </Link>
              {property.description && (
                <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
                  {property.description}
                </p>
              )}
              <small
                style={{ color: "#999", display: "block", marginTop: "0.5rem" }}
              >
                Added: {new Date(property.createdAt).toLocaleDateString()}
              </small>

              <div
                style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}
              >
                <button
                  onClick={() => setEditingId(property.id)}
                  style={{
                    padding: "6px 12px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit
                </button>

                <form action={deleteProperty} style={{ display: "inline" }}>
                  <input type="hidden" name="propertyId" value={property.id} />
                  <button
                    type="submit"
                    style={{
                      padding: "6px 12px",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      if (
                        !confirm(
                          "Are you sure you want to delete this property?",
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                  >
                    🗑️ Delete
                  </button>
                </form>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
