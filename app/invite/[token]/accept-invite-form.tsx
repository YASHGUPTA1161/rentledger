"use client";

import { useState } from "react";
import { acceptInvite } from "./actions";

// This component is "use client" because it uses useState + form interactivity
// It receives the token from the parent server component (page.tsx)

export default function AcceptInviteForm({ token }: { token: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Client-side validation (fast, no server round-trip)
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    // Server action call — this is where the real work happens
    const result = await acceptInvite(token, password);

    if (!result.success) {
      setError(result.error || "Something went wrong");
      setLoading(false);
    }
    // If success, the server action redirects — no need to handle here
  }

  return (
    <form action={handleSubmit}>
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "#374151",
            marginBottom: "4px",
          }}
        >
          Set Your Password
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Min 6 characters"
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "0.875rem",
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "#374151",
            marginBottom: "4px",
          }}
        >
          Confirm Password
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          placeholder="Re-enter password"
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "0.875rem",
          }}
        />
      </div>

      {error && (
        <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: "0 0 12px" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          border: "none",
          borderRadius: "8px",
          background: loading ? "#9ca3af" : "#2563eb",
          color: "#fff",
          cursor: loading ? "wait" : "pointer",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        {loading ? "Setting up..." : "Set Password & Login"}
      </button>
    </form>
  );
}
