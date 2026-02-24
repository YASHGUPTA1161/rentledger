"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button
      onClick={() => signIn("google")}
      style={{
        marginTop: "12px",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        background: "#fff",
        color: "#374151",
        cursor: "pointer",
        fontWeight: 500,
        fontSize: "0.95rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path
          fill="#FFC107"
          d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3L37 10C33.6 6.9 29 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c10.5 0 18-7.5 18-19 0-1.3-.1-2.7-.4-4z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3L37 10C33.6 6.9 29 5 24 5c-7.6 0-14.2 4.3-17.7 9.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 43c5.2 0 9.9-1.8 13.5-4.7L31 33.9C29.2 35.2 27 36 24 36c-5.3 0-9.6-2.9-11.3-7l-6.6 5.1C9.7 38.7 16.4 43 24 43z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20H24v8h11.3c-.9 2.5-2.5 4.5-4.7 5.9l6.5 4.4C41 34.6 44 29.8 44 24c0-1.3-.1-2.7-.4-4z"
        />
      </svg>
      Sign in with Google
    </button>
  );
}
